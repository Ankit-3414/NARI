# NARI V1 — Intelligence Layer Implementation Plan

Building directly on `NARI_V1_ARCHITECTURE.md`, `NARI_V1_VISION.md`, `NARI_V1_OPENING_FLOW.md`. This spec is well-calibrated — it already incorporates the versioned-memory, externalized-identity, single-orchestrator, and no-premature-graph-database conclusions from the earlier review, so I'm not re-critiquing it. This is the next layer down: actual schemas, job logic, and integration points for the parts that make NARI *smarter* (memory, reflection, identity, awareness, reasoning), so this is buildable rather than aspirational.

---

## 1. Build order and dependencies

These six pieces aren't independent — building them out of order means building on top of something that'll need rework:

1. **Memory versioning schema** (`memory_versions`, `memory_edges`, `provenance_links`) — foundation everything else reads from or writes to.
2. **Identity profile** (`identity_profile`) — independent of memory, can be built in parallel with #1.
3. **Reflection job** (`reflection_runs`) — depends on #1 existing (it writes proposed memory versions) and benefits from #2 existing (it can also propose identity updates).
4. **Awareness snapshots** (`awareness_snapshots`) — depends on #1 for "recent relevant memory," otherwise independent; needs one new frontend capability (current-page reporting) that doesn't exist yet.
5. **Reasoning loop upgrade** (verify step) — independent, can happen anytime, but is most valuable once #1–#4 give it something worth verifying against.
6. **The Bridge / Globe / opening flow (UI)** — reads from #4 primarily; can be prototyped against fake/static data before #1–#3 are done, but shouldn't ship reflection-related copy ("reflection status checked") until #3 is real.

Recommended order: **1 → 2 → 3 → 4 → 5**, with UI work (6) prototyped in parallel against placeholder data once #4's shape is settled.

---

## 2. Memory Layer

### Schema

Replaces `KnowledgeNode`'s overwrite-on-conflict design. `KnowledgeNode` doesn't get deleted — it gets migrated (see below).

```python
class MemoryVersion(BaseModel, table=True):
    __tablename__ = "memory_versions"

    concept_key: str = Field(index=True, max_length=200)   # NOT unique — this is the whole fix
    summary: str
    raw_content: Optional[str] = None
    source: str = "conversation"
    confidence: float = 0.5

    valid_from: datetime = Field(default_factory=utc_naive)
    superseded_by_id: Optional[int] = Field(default=None, foreign_key="memory_versions.id")
    needs_review: bool = False

    source_event_id: Optional[int] = Field(default=None, foreign_key="activity_logs.id")


class MemoryEdge(BaseModel, table=True):
    __tablename__ = "memory_edges"

    from_id: int = Field(foreign_key="memory_versions.id", index=True)
    to_id: int = Field(foreign_key="memory_versions.id", index=True)
    relation_type: str   # e.g. "triggered_interest_in", "caused", "led_to", "part_of"
    confidence: float = 0.5


class ProvenanceLink(BaseModel, table=True):
    __tablename__ = "provenance_links"

    memory_version_id: int = Field(foreign_key="memory_versions.id", index=True)
    activity_log_id: int = Field(foreign_key="activity_logs.id")
    note: Optional[str] = None   # e.g. "extracted during nightly digestion, batch #4821"
```

`provenance_links` is a many-to-many on top of `source_event_id` (which covers the single primary source) — use it when a consolidated/reflected memory draws on multiple original events, which will start happening as soon as reflection exists.

### Reading "current belief"

```python
def get_current(session, concept_key: str) -> Optional[MemoryVersion]:
    return session.exec(
        select(MemoryVersion)
        .where(MemoryVersion.concept_key == concept_key)
        .where(MemoryVersion.superseded_by_id == None)
        .order_by(MemoryVersion.valid_from.desc())
    ).first()
```

### Writing an update (replaces `store_knowledge`'s silent overwrite)

```python
def write_memory(session, concept_key, summary, source_event_id, confidence=0.5, source="conversation"):
    current = get_current(session, concept_key)

    if current is None:
        new = MemoryVersion(concept_key=concept_key, summary=summary,
                             source_event_id=source_event_id, confidence=confidence, source=source)
        session.add(new)
        session.commit()
        return new, None  # (new_version, conflict)

    similarity = semantic_similarity(current.summary, summary)  # reuse existing embedding model
    if similarity > 0.85:
        # High overlap — treat as a natural update, not a conflict. Auto-supersede.
        new = MemoryVersion(concept_key=concept_key, summary=summary,
                             source_event_id=source_event_id, confidence=confidence, source=source)
        session.add(new)
        session.flush()
        current.superseded_by_id = new.id
        session.commit()
        return new, None
    else:
        # Meaningfully different content under the same concept_key — likely a real
        # change of belief, not a rephrasing. Write it, but flag for human review
        # rather than silently overwriting what NARI believed before.
        new = MemoryVersion(concept_key=concept_key, summary=summary, source_event_id=source_event_id,
                             confidence=confidence, source=source, needs_review=True)
        session.add(new)
        session.commit()
        return new, current  # conflict = the previous belief, surfaced for review
```

The `similarity > 0.85` threshold is a starting point, not a promise — tune it once you see real conflict/non-conflict examples from actual usage. The important structural property is: **nothing is ever destroyed.** Even the auto-superseded path keeps the old row queryable via `superseded_by_id`, so "how did my interest in X evolve" can walk the chain regardless of which path a given update took.

### Migrating existing `KnowledgeNode` rows

One-time Alembic data migration: for each existing `KnowledgeNode`, create one `MemoryVersion` with `concept_key = concept`, `valid_from = created_at`, `superseded_by_id = None`. Nothing is lost; everything currently known becomes the first version in its own chain. Keep `KnowledgeNode` and its `sqlite-vec` embedding side-table as the retrieval index — don't rebuild vector search, just point it at `memory_versions.id` instead of the old table's id, or add an embeddings table with a foreign key to `memory_versions`. Retrieval logic (`semantic_memory.search_knowledge`) needs one change: join through to `MemoryVersion` and filter `superseded_by_id IS NULL` so search only ever surfaces current beliefs by default, with a separate "history" query path for when you specifically want the evolution.

---

## 3. Identity Layer

```python
class IdentityProfile(BaseModel, table=True):
    __tablename__ = "identity_profile"

    version: int = Field(index=True)
    tone: str
    values: str            # JSON-encoded list, or a text block — start with text, structure later if needed
    priorities: str
    communication_style: str
    confidence_calibration: str
    phrasing_rules: str
    is_active: bool = True
    proposed_by: str = "manual"   # "manual" | "reflection"
    approved_at: Optional[datetime] = None
```

Only one row has `is_active=True` at a time. `llm_client.py`'s hardcoded persona string gets replaced with:

```python
identity = session.exec(
    select(IdentityProfile).where(IdentityProfile.is_active == True)
).first()
system_prompt = render_identity_block(identity) + domain_behavior_rules  # domain rules stay in code, identity doesn't
```

Seed row 1 with today's actual hardcoded persona text, split into the fields above, so behavior doesn't change on day one — this is a refactor of where identity lives, not a rewrite of what it says.

---

## 4. Reflection Layer

```python
class ReflectionRun(BaseModel, table=True):
    __tablename__ = "reflection_runs"

    ran_at: datetime = Field(default_factory=utc_naive)
    events_reviewed: int
    memory_conflicts_found: int
    memory_versions_proposed: int
    identity_change_proposed: bool = False
    status: str = "pending_review"   # "pending_review" | "reviewed" | "dismissed"
    summary: str   # short human-readable digest of what this run found
```

### Job logic (new APScheduler job, mirrors the existing `daily_briefing` pattern)

```python
async def run_nightly_reflection(session):
    since = last_reflection_run_time(session)
    events = get_activity_logs_since(session, since)
    if not events:
        return

    # 1. Group related activity (cheap heuristic pass first: same entity_type + close in time;
    #    reserve the LLM call for the harder judgment calls below, not for grouping itself)
    clusters = group_related_events(events)

    conflicts_found = 0
    versions_proposed = 0

    for cluster in clusters:
        extracted = await llm_extract_concepts(cluster)   # same job digest_context already does
        for concept in extracted:
            new_version, conflict = write_memory(
                session, concept.key, concept.summary,
                source_event_id=cluster.representative_event_id,
                confidence=concept.confidence
            )
            versions_proposed += 1
            if conflict:
                conflicts_found += 1

    identity_proposed = await maybe_propose_identity_update(session, events)

    session.add(ReflectionRun(
        events_reviewed=len(events),
        memory_conflicts_found=conflicts_found,
        memory_versions_proposed=versions_proposed,
        identity_change_proposed=identity_proposed,
        summary=build_human_summary(conflicts_found, versions_proposed, identity_proposed),
    ))
    session.commit()
```

`needs_review=True` rows from conflicts, plus any proposed `IdentityProfile` row with `is_active=False, proposed_by="reflection"`, are what the Bridge's "awareness summary" surfaces the next time you open the app — this is also the real content behind the opening-flow doc's example line ("Memory Versioning still appears to be the next best step" is exactly the shape of thing a `ReflectionRun.summary` should produce once this exists for real).

This replaces the current `digest_context` event-triggered digestion with a scheduled nightly pass — keep `digest_context`'s LLM-extraction logic, just move its trigger from "1 second after every context log" to "once nightly over everything since last run," which is both cheaper and matches the architecture doc's "slow loop" framing.

---

## 5. Awareness Layer

```python
class AwarenessSnapshot(BaseModel, table=True):
    __tablename__ = "awareness_snapshots"

    current_page: Optional[str] = None
    current_project: Optional[str] = None
    location_label: Optional[str] = None
    weather_summary: Optional[str] = None
    active_reminders_count: int = 0
    active_goals_summary: Optional[str] = None
    session_started_at: Optional[datetime] = None
```

Most of this already exists as live queries inside `context_builder.build_context_window` — weather, location, active reminders/goals are already assembled per-request. What's genuinely new: **`current_page` doesn't exist anywhere in the stack today** (confirmed directly — no route/page tracking is sent to the backend currently). To support it:

- Frontend: on route change, `POST /api/v1/awareness/ping` with `{current_page, current_project}` (cheap, fire-and-forget, debounced).
- Backend: upsert a single `AwarenessSnapshot` row per session (or just per-user, since this is single-user) rather than growing a new row per page view — this is live state, not a log.
- `context_builder` reads the latest snapshot and folds `current_page`/`current_project` into the context window alongside what it already assembles.

This is the one piece of the Awareness layer that's actual new backend work; everything else is wiring already-computed values into one snapshot record instead of recomputing them ad hoc per request.

---

## 6. Reasoning Loop — adding the missing "verify" step

The existing tool-execution loop (iterative, fixed in the last patch) covers steps 1–4 of the architecture doc's model: collect context → retrieve memory → plan (implicit, via tool selection) → execute tools. Step 5, **verify results**, doesn't exist yet — the loop currently trusts whatever a tool returns and moves straight to either another tool call or a final reply.

Concrete, bounded version (don't apply this to every message — reserve it for actions that write data, since that's where a wrong tool call actually costs something):

```python
if function_name in WRITE_TOOLS:  # create_task, create_note, update_*, delete_*, etc.
    verification = await verify_tool_result(function_name, function_args, tool_result)
    if verification.looks_wrong:
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "name": function_name,
            "content": f"{tool_result}\n\n[Note: {verification.concern} — consider correcting before replying.]"
        })
```

`verify_tool_result` can start as a cheap deterministic check (did the tool return an error string? does the created object's title match what the user actually asked for, via simple string containment?) before it needs to be a second LLM call — most of the value here is catching the tool-execution-error case cleanly rather than presenting a raw error message as if it were a success, which is a real gap in the current implementation (an `execute_tool` failure currently gets fed back as a normal tool result string and the model has to notice on its own that it starts with "Error executing tool").

---

## 7. AI Tool Coverage — Closing Remaining CRUD Gaps

Cross-checked the current tool registry against every service method. Most domains already have full CRUD as AI tools (tasks, notes, reminders, habits, goals, subjects, study sessions). Three real gaps found:

- **Analytics has zero tool coverage.** `get_dashboard_summary`, `get_study_trends`, `get_task_completion_rate`, `get_temporal_performance`, `get_neural_heatmap`, `get_subject_distribution` all exist in the service with no corresponding tools. Add read tools for all six — this is derived/computed data, so "CRUD" here really just means R.
- **Locations are half-built**, same pattern as the `create_task` bug already fixed: `create_location`/`list_locations` exist as tools, `update_location`/`delete_location` don't. Add both.
- **Settings have no tool coverage.** Add read/update tools for ordinary preferences (theme, timezone, default AI model, etc.). **Do not** expose `get_decrypted_setting` as a tool under any circumstances — that method looks like it retrieves decrypted secrets, and making it chat-callable creates a real exfiltration path via prompt injection or an offhand phrasing mistake in normal conversation.

### Explicit boundary: the new intelligence-layer tables do not get the same treatment

`identity_profile`, `memory_versions`, `reflection_runs` (Sections 2–4 above) should get **read-only** tools from the general chat surface — NARI should be able to tell you what it currently believes about something, or what its current identity/tone settings are, if asked. They should **not** get general write/update tools alongside everything else.

The reason: the entire reflection design in this document is built around "propose, don't auto-apply" — conflicts get `needs_review = True`, identity changes get proposed with `is_active = False` pending your approval. If the same chat tool surface that lets you say "create a task" also lets you say "update your identity" or "resolve that memory conflict," the approval gate is just conversationally bypassable — a casual instruction (yours or an injected one) silently does what the whole versioning/review design was built to prevent. Keep writes to these three tables restricted to the reflection job's own proposal flow and whatever review UI surfaces those proposals — not the general-purpose tool registry.

## 8. What this still doesn't need

Consistent with the architecture doc's own instinct, and worth restating since it's easy to over-scope once you're deep in schema design: no graph database (the `memory_edges` table above *is* the graph, at a scale where SQLite is fine), no message broker, no multi-agent framework, no durable workflow engine. Every table and job above sits on the stack you already have.

---

## 9. NARI Agent Self-Reflection Alignment & v1 Mapping

NARI Agent's autonomous self-reflection identified 5 primary self-improvement targets. These map directly into the v1 implementation roadmap:

| Agent Self-Improvement Goal | Roadmap Step & Feature Component | Implementation Details |
| :--- | :--- | :--- |
| **1. Better Understanding of Context** | **Step 4: Awareness Snapshots** & `context_builder` | Real-time `current_page`, `current_project`, weather, and temporal snapshot injection into top-5 context window. |
| **2. More Proactive Suggestions** | **Step 3: Reflection Job (`reflection_runs`)** & Opening Flow | Nightly background reflection generates proactive daily briefing suggestions, task reminders, and habit nudges. |
| **3. Enhanced Emotional Intelligence** | **Step 2: Identity Profile (`identity_profile`)** | Dynamic persona fields (`tone`, `communication_style`, `empathy_level`) adjust agent warmth during high-stress periods. |
| **4. Seamless Daily Routine Integration** | **Step 3: Behavioral Mining** & **Step 7: Analytics Tools** | Mapped activity history (`ActivityLog`) auto-proposes task schedules matching user's peak focus hours (e.g. night coding). |
| **5. Improved Voice Output (TTS/STT)** | **Frontend Audio Module** (Web Speech API / Local TTS) | Browser-native Web Speech API & local TTS integration for hands-free natural conversational dialogue. |

