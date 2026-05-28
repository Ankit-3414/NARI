# NARI Versioning Protocol

NARI follows a modified Semantic Versioning strategy that reflects its stage-based development lifecycle.

## Version Format

```text
MAJOR.MINOR.PATCH[-SUFFIX]
```

## Version Parts

### MAJOR

Increment for architectural shifts that change the scope of the system.

Examples:

- Moving from a single-user system to a multi-user platform.
- Replacing the core intelligence architecture.

### MINOR

Increment when a significant build stage is completed or initiated.

Examples:

- Moving from Stage 8 analytics to Stage 8.5 PWA/offline support.
- Moving from Stage 8.5 to Stage 9 local AI.
- Adding a major feature domain such as goals or habits.

### PATCH

Increment for fixes, refinements, small behavior changes, and deployment improvements.

Examples:

- EventBus bug fixes.
- ActivityLog consistency fixes.
- UI polish.
- Static IP or deployment script calibration.

### SUFFIX

Use suffixes such as `-alpha.x` during pre-release development.

Current phase: alpha development and testing on Server-01.

## Change Management

When the version changes, update the relevant places:

- `backend/.env`, when the deployed environment exposes a version.
- `backend/app/core/config.py`, when the application config exposes a version.
- `frontend/package.json`.
- `README.md`.
- `docs/NARI_Architecture.md`.

Tag major and minor milestones in git.
