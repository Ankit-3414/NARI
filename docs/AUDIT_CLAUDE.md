# NARI Codebase Audit (Claude Code Review)

This document contains the detailed findings and action items compiled from the Claude Code codebase audit of the NARI platform.

---

## 🔴 Critical Bugs (Logic / Data Corruption)

### 1. **Habit Field Name Mismatch — AI Tools Crash at Runtime**
**File:** [tools.py](file:///H:/NARI/backend/app/ai/tools.py#L410) vs [context_builder.py](file:///H:/NARI/backend/app/ai/context_builder.py#L94)

The `list_habits` tool accesses `h.title`, but the `Habit` model and schema use `h.name`. The `context_builder` correctly uses `h.name`. This throws an `AttributeError` every time the AI calls `list_habits`, silently returning a tool error string to the LLM instead of actual habit data.

```python
# tools.py — BUG
f"- [ID {h.id}] {h.title} ..."  # 'title' does not exist on Habit

# context_builder.py — CORRECT
f"- [ID: {h.id}] {h.name} ..."
```
**Fix:** Change `h.title` → `h.name` in `tools.py`.

---

### 2. **Timezone-Naive Comparison in Scheduler — Reminders Fire Randomly or Never**
**File:** [manager.py](file:///H:/NARI/backend/app/scheduler/manager.py#L88)

SQLite stores `DATETIME` columns **without timezone info** by default. The scheduler compares `Reminder.due_at <= now` where `now = datetime.now(UTC)` is timezone-aware. SQLAlchemy returns a naive datetime from SQLite. This comparison raises a `TypeError: can't compare offset-naive and offset-aware datetimes` in Python, which is silently caught by the generic exception handler — meaning **no reminders ever fire**.

The fix exists for `triggered_at` (lines 121-122 have the `replace(tzinfo=UTC)` workaround), but is missing for the primary `due_at` and `snoozed_until` comparisons in `check_reminders`.

```python
# Fix: normalize due_at before comparison
due_at = reminder.due_at
if due_at.tzinfo is None:
    due_at = due_at.replace(tzinfo=UTC)
```
The real fix is to apply a `PRAGMA` to enforce UTC storage or to normalize in the ORM layer uniformly.

---

### 3. **No Conversation History Sent to LLM — AI Has Zero Memory Within a Session**
**File:** [llm_client.py](file:///H:/NARI/backend/app/ai/llm_client.py#L134)

Every `chat()` call rebuilds messages from scratch with only the system prompt and the current user message:
```python
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": message}  # Only the current turn
]
```
Prior turns in the conversation are **never included**. The AI cannot reference anything said earlier in the same session. The frontend stores messages in IndexedDB (`chat_messages`), but never passes them back to the backend.

**Fix:** The `ChatRequest` schema and `useAiChat` hook both need to accept and forward conversation history. The backend must prepend prior `[user, assistant]` pairs to `messages` before calling the LLM.

---

### 4. **Context Digest Race Condition — Duplicate Processing / Data Corruption**
**File:** [main.py](file:///H:/NARI/backend/app/main.py#L49), [events.py](file:///H:/NARI/backend/app/core/events.py#L125), [context.py](file:///H:/NARI/backend/app/api/v1/context.py#L31)

`digest_context()` is triggered from **three places simultaneously**:
- On app startup (with a 2s delay)
- On every `CONTEXT_LOGGED` event (i.e., every time a context entry is saved)
- Via the manual `/context/digest` API endpoint

There is no lock or mutex. If startup is slow and events fire before 2s, multiple concurrent digest calls will read the same `last_digested_context_id`, call NVIDIA NIM in parallel, and potentially double-write knowledge nodes or create duplicates. The `store_knowledge` function does an upsert by `concept` name, but concurrent transactions can still produce a race on the `SELECT` + `INSERT` path.

---

## 🟠 Security Issues

### 5. **API Key Stored in `localStorage` — XSS Exfiltration Risk**
**File:** `frontend/src/store/authStore.js`

The auth store was designed to use HttpOnly cookies (which is correct), but simultaneously stores the raw API key in `localStorage`:
```js
localStorage.setItem('NARI_API_KEY', key);
```
This completely defeats the HttpOnly cookie security model. Any XSS vulnerability anywhere in the app can read `localStorage.NARI_API_KEY`. Since the backend also accepts `Authorization: Bearer <key>` headers directly, this is a full credential leak.

**Fix:** Remove all `localStorage` storage of the raw API key. Rely solely on the HttpOnly cookie. The WebSocket client (`websocket.js:37`) also falls back to `localStorage` — that fallback should use the subprotocol mechanism instead.

---

### 6. **`LoginPage` Doesn't Pass Key to Auth Store — WebSocket Auth Breaks After Login**
**File:** `frontend/src/pages/LoginPage.jsx:23`

```js
setAuthenticated(true); // key is NOT passed
```
`setAuthenticated(active, key)` accepts a second `key` parameter to save the key for WebSocket authentication, but `LoginPage` never passes it. After a fresh login, `authStore.apiKey` is `null` unless `VITE_NARI_API_KEY` is set as an env variable. The `useWebSocket` hook checks `if (!apiKey) return` — so **WebSocket never connects** when the user has only used the login form without a pre-configured env key.

---

### 7. **Default Credentials Are Well-Known**
**Files:** [backend/.env.example](file:///H:/NARI/backend/.env.example), `frontend/.env.example`

Both example files default to `neural_link_established` as the API key. Users who run setup without changing this default will have a publicly known credential on their server. The README doesn't prominently warn about this. A startup validation check that refuses to run with the default key in production would mitigate this.

---

### 8. **`AI_ENABLED` Config Flag Is Never Enforced**
**File:** [config.py](file:///H:/NARI/backend/app/core/config.py#L43), [ai.py (endpoints)](file:///H:/NARI/backend/app/api/v1/ai.py)

`AI_ENABLED: bool = False` is defined in settings and defaults to off, but the AI endpoints (`/ai/chat`, `/ai/intent`) are always mounted regardless of this flag. A user who leaves `AI_ENABLED=false` but accesses the endpoint will get AI responses (if a key is configured) or a confusing key-not-set error rather than a clear "AI disabled" response.

---

## 🟡 Logic & Design Problems

### 9. **Single Tool Call Per Turn — Hardcoded Limitation**
**File:** [llm_client.py](file:///H:/NARI/backend/app/ai/llm_client.py#L161)

```python
# NVIDIA NIM templates only support a single tool call per turn. Restrict to the first one.
active_tool_calls = response_message.tool_calls[:1]
```
This is documented as a NIM template limitation, but it means compound requests like *"Create a task and log my mood"* silently drop the second action. The user gets no feedback that their second intent was ignored. The system should either tell the user, chain tool calls iteratively, or route to a model that supports parallel calls.

---

### 10. **Recurring Reminder Re-Schedule Logic Bug**
**File:** [reminder_service.py](file:///H:/NARI/backend/app/services/reminder_service.py) in `dismiss()`

```python
rule = rrulestr(reminder.repeat_rule, dtstart=reminder.due_at)
next_occurrence = rule.after(reminder.due_at)
```
`rule.after(dt)` returns the **next occurrence strictly after** `dt`. If a reminder was snoozed and re-triggered, `due_at` was already updated to `snoozed_until`, so the "next" calculation is relative to the snoozed time, not the original scheduled time. This causes **drift** in recurring reminders — a daily 9 AM reminder that gets snoozed to 9:15 AM will subsequently fire at 9:15 AM every day.

---

### 11. **`check_reminders` Polls Every 1 Second — Unnecessary DB Load**
**File:** [manager.py](file:///H:/NARI/backend/app/scheduler/manager.py#L35)

```python
trigger=IntervalTrigger(seconds=1)
```
1-second polling of the database for due reminders creates 86,400 DB reads per day on a single-user SQLite system. Since reminder precision to the second is not a product requirement, 10–30 second polling would be identical from a UX standpoint and reduce load by 10–30x. The `coalesce=True` and `max_instances=1` settings protect against buildup but don't reduce the read overhead.

---

### 12. **Dead Config Variables — GROQ and Anthropic Keys Stored But Never Used**
**File:** [config.py](file:///H:/NARI/backend/app/core/config.py), [user_service.py](file:///H:/NARI/backend/app/services/user_service.py)

`GROQ_API_KEY` and `ANTHROPIC_API_KEY` are in config, in the `.env.example`, in the `ALLOWED_KEYS` set for settings updates, and encrypted/decrypted in the user service — but **nothing in the codebase routes to Groq or Anthropic**. The `AI_PROVIDER` config field also does nothing. The LLM client always goes to NVIDIA NIM. Users who enter a Groq or Anthropic key in Settings will see a "has_groq_api_key: true" response but the key will never be used.

---

### 13. **`search_memory` Tool Uses Plain SQL `LIKE` Instead of Semantic Search**
**File:** [tools.py](file:///H:/NARI/backend/app/ai/tools.py) (`search_memory` handler)

Despite having a full vector semantic memory system (`SemanticMemoryService` with `sentence-transformers`), the `search_memory` tool uses a naive `LIKE '%query%'` SQL query against the `ActivityLog` and `Note` tables. It completely bypasses the vector search. A query for "when was I most stressed" will return nothing because no log contains the literal string, even though semantically relevant entries may exist.

---

### 14. **AI Lacks Core CRUD Tools — Can Read But Not Write Most Entities**
**File:** [tools.py](file:///H:/NARI/backend/app/ai/tools.py)

The AI can only `create_task` and `complete_task`. It has no tools for:
- Creating/editing/deleting reminders, habits, goals, or notes
- Updating a task (change priority, rename)
- Starting or stopping a study session

The system prompt tells NARI it can "manage all domains of their personal productivity," but most domains are read-only from the AI's perspective. The `list_*` tools provide context, but can't act.

---

## 🔵 Frontend Issues

### 15. **`useSyncEngine` Missing `reminders` and `study` Entities**
**File:** `frontend/src/hooks/useSyncEngine.js`

The offline sync queue handles `tasks`, `notes`, `habits`, `goals`, `context`, and `subjects` — but **not reminders or study sessions**. The comment even says `// Add other entities here`. If the user creates or modifies a reminder offline, it will be queued but never synced back to the server when connectivity is restored.

---

### 16. **`useWebSocket` Does Not Reconnect on Drop**
**File:** `frontend/src/hooks/useWebSocket.js`, `frontend/src/api/websocket.js`

The `wsClient.connect('/ws')` is called once on mount. There is no reconnection logic visible in the hook. If the WebSocket drops (server restart, network blip), the UI stops receiving real-time updates silently — no error, no retry, no indicator. The user won't know their view is stale.

---

### 17. **Context Stream: Duplicate Experiment Components in Production Code**
**File:** `frontend/src/experiments/context-stream/`

There is a full duplicate of `ContextEntryCard.jsx`, `ContextMemoryPanel.jsx`, `SuggestionActions.jsx`, and `contextSuggestionRules.js` inside `src/experiments/context-stream/` — nearly identical to the production versions in `src/components/context/`. These experiment files are importable and may be accidentally used. If the production components are updated, the experiment copies will diverge silently, creating maintenance confusion.

---

### 18. **Hardcoded IP Address in CORS Origins**
**File:** [main.py](file:///H:/NARI/backend/app/main.py#L93)

```python
"http://192.168.1.100",
"http://192.168.1.100:3000"
```
A private IP is hardcoded directly in the application source. If the server's LAN IP changes (DHCP reassignment, different network), the frontend becomes unreachable without a code change. This should be managed entirely through `NARI_ALLOWED_ORIGINS` in `.env`.

---

## Summary Table

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | Backend/AI | `h.title` AttributeError in `list_habits` tool |
| 2 | 🔴 Critical | Backend/Scheduler | Timezone-naive `due_at` comparison breaks all reminders |
| 3 | 🔴 Critical | Backend/AI | No conversation history → stateless AI |
| 4 | 🔴 Critical | Backend/Logic | `digest_context` race condition with no lock |
| 5 | 🟠 Security | Frontend | API key stored in `localStorage` defeats HttpOnly cookie |
| 6 | 🟠 Security | Frontend | Login doesn't pass key → WebSocket never authenticates |
| 7 | 🟠 Security | Config | Default credential `neural_link_established` is well-known |
| 8 | 🟠 Security | Backend | `AI_ENABLED=false` is not enforced on AI endpoints |
| 9 | 🟡 Logic | Backend/AI | Single tool call limit silently drops compound requests |
| 10 | 🟡 Logic | Backend | Recurring reminder drift from snooze-relative rescheduling |
| 11 | 🟡 Logic | Backend | 1-second scheduler polling is excessive for reminder use case |
| 12 | 🟡 Logic | Backend | GROQ/Anthropic keys stored and encrypted but never routed to |
| 13 | 🟡 Logic | Backend/AI | `search_memory` uses LIKE instead of semantic vector search |
| 14 | 🟡 Logic | Backend/AI | AI missing CRUD tools for reminders, notes, habits, goals |
| 15 | 🔵 Frontend | Sync | `reminders` and `study` not in offline sync engine |
| 16 | 🔵 Frontend | WS | No WebSocket reconnection on drop |
| 17 | 🔵 Frontend | Structure | Duplicate experiment components alongside production code |
| 18 | 🔵 Config | Backend | Hardcoded LAN IP in CORS config |
