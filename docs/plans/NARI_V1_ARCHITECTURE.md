# NARI v1 Architecture
**Design target for the next major experience update**

## Goal
NARI v1 should preserve the current working stack, but shift the architecture toward:
- narrative memory
- versioned identity
- background reflection
- awareness-driven UI
- reliable multi-step reasoning
- provenance for every important memory

## Keep the Current Foundation
The current stack is already a strong base:
- FastAPI backend
- SQLModel + SQLite
- Alembic migrations
- APScheduler
- WebSockets
- React + Tailwind frontend
- CLI thin client
- EventBus-style service decoupling
- PWA/offline support

NARI v1 should evolve this stack, not replace it with enterprise infrastructure unless scale demands it.

## Architecture Layers

### 1. Event Layer
Everything meaningful should enter the system as an event:
- task actions
- note edits
- context logs
- location updates
- reminder triggers
- page/context changes
- geofence transitions

Events should be append-only and auditable.

### 2. Memory Layer
Memory should not be flat overwrite-only data.

Use a versioned memory model:
- append-only memory rows
- concept key / subject key
- valid_from timestamp
- supersedes_id for replacement history
- needs_review for uncertain changes
- source_event_id for provenance

This preserves the timeline of belief changes.

### 3. Reflection Layer
A nightly reflection job should:
- read the day’s events
- group related activity
- detect contradictions
- propose memory updates
- propose identity updates
- surface review items instead of auto-overwriting important beliefs

Reflection should improve the system without pretending it can be perfectly autonomous.

### 4. Identity Layer
Identity should be stored separately from the model prompt:
- tone
- priorities
- values
- communication style
- confidence behavior
- phrasing rules

The model becomes the engine. Identity becomes the compiled state that guides the engine.

### 5. Awareness Layer
NARI should always know the user’s current context:
- current page
- current project
- location
- weather
- active reminders
- active goals
- recent relevant memory
- current session context

This awareness should be injected into the response flow, but displayed only selectively.

### 6. Presentation Layer
The Bridge is the presentation surface for awareness.
It should summarize, not dump.

## Proposed Core Tables / Records

### Existing foundations to preserve
- `activity_logs`
- `tasks`
- `notes`
- `goals`
- `habits`
- `reminders`

### v1 additions
- `memory_versions`
- `memory_edges`
- `identity_profile`
- `reflection_runs`
- `awareness_snapshots`
- `provenance_links`

### Why not a graph database yet?
For a single-user local system, SQLite plus relational edge tables is enough for v1.
Add a graph database later only if actual query patterns justify it.

## Runtime Loops

### Fast loop
Handles immediate interaction:
- chat
- UI actions
- tool execution
- reminders
- page updates
- location updates

### Slow loop
Runs in the background:
- reflection
- consolidation
- memory compression
- identity proposals
- cleanup

The slow loop should be scheduled and durable, not constantly noisy.

## Reasoning Model
NARI should use one orchestrator with structured steps:
1. collect context
2. retrieve relevant memory
3. plan action
4. execute tools
5. verify results
6. answer or queue follow-up work

Do not turn v1 into a multi-agent swarm unless the problem genuinely requires it.

## Security and Safety
- Keep provenance for every important memory
- Review memory conflicts before they become permanent
- Keep sensitive processing local when possible
- Preserve human control over major identity changes
- Keep voice/speech out of v1 until the later milestone

## Design Boundary
NARI v1 is not trying to become a fictional consciousness.
It is trying to become a stable, evolving, context-aware intelligence with a persistent record of how it learns.
