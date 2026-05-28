# Feature: Context Stream

## Overview

The **Context Stream** is NARI's low-friction daily logging pipeline. It lets the user capture activities, thoughts, feelings, events, and loose intent in raw natural language.

This feature is the foundation for Stage 9. It captures the rhythm of daily life before the AI layer exists, giving later intent routing and memory systems a real behavioral dataset.

## Core Mechanics

### 1. Database Layer

Context entries are stored in the existing `activity_logs` table so user-written context appears chronologically beside system-generated events such as task completions and study sessions.

- **Entity type:** `context`
- **Action:** `logged`
- **Timestamp:** UTC.
- **Payload shape:**

```json
{
  "text": "Raw user input string",
  "metadata": {}
}
```

### 2. Backend Layer

The API accepts raw text and emits an internal event.

- **Endpoint:** `POST /api/v1/context`
- **Flow:**
  1. Validate and accept raw text.
  2. Emit a context event through EventBus.
  3. ActivityService writes the entry to `activity_logs`.
  4. WebSocket listeners can refresh timeline or HUD views.

### 3. CLI Layer

The CLI provides fast terminal capture:

```bash
./nari.sh tell "Finished physics revision and felt focused"
```

The command posts to the API and should return quickly.

### 4. Frontend Layer

The dashboard provides a prominent ContextInput field.

Expected interactions:

- Submit on Enter.
- Clear the input immediately after a successful submit.
- Refresh the Daily Timeline through cache invalidation or WebSocket events.
- Queue the action when offline, then sync when connectivity returns.

## Stage 9 Evolution

### Intent Engine

The Stage 9 intent engine should subscribe to Context Stream events and classify actionable text.

Examples:

- "I drank water" can map to a habit completion.
- "Studying physics for 1 hour" can map to a study session.
- "Remind me to review notes at 7" can map to a reminder.

Clear intent can be routed into existing services. Ambiguous intent should remain a context log or ask for confirmation.

### Semantic Memory

Context Stream entries become one source for local semantic memory. They can be embedded, indexed, summarized, and retrieved with notes, tasks, study sessions, goals, habits, and ActivityLog entries.

### Nightly Consolidation

Idle-time jobs can summarize the day, update local indexes, and prepare compact memory artifacts. Heavy processing should happen during quiet hours so daily NARI usage stays responsive.

## Status

Stage 8.5 is complete. The Context Stream is part of the foundation for Stage 9, where local AI can begin using these events for intent routing and personalized memory.
