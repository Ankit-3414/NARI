# NARI Versioning Protocol

NARI follows a modified **Semantic Versioning (SemVer 2.0.0)** strategy to reflect its unique stage-based development lifecycle.

## Version Format
`MAJOR.MINOR.PATCH[-SUFFIX]`

### 1. MAJOR (Architectural Shifts)
Incremented when the fundamental scope of the platform changes.
- *Example:* Transitioning from a single-user system to a multi-device platform (Year 4+).
- *Example:* Complete rewrite of the core neural engine.

### 2. MINOR (Build Stages)
Incremented when a significant **Build Stage** is completed or initiated.
- *Example:* Moving from Stage 8 (Analytics) to Stage 9 (AI Layer).
- *Example:* Adding a completely new feature domain (e.g., Habits or Goals).

### 3. PATCH (Refinements & Fixes)
Incremented for small behavioral fixes, UI/UX polishes, or environment recalibrations.
- *Example:* Static IP calibration (192.168.1.100).
- *Example:* Bug fixes in the EventBus or ActivityService.

### 4. SUFFIX (`-alpha.x`)
Used during the current pre-release development phase. 
- *Current Phase:* Alpha (Development & Testing on Server-01).

---

## Change Management
- Every version increment must be reflected in:
    - `backend/.env` & `backend/app/core/config.py`
    - `frontend/package.json`
    - `README.md` & `docs/NARI_Architecture.md`
- Tag the commit in git for major/minor milestones.
