# NARI — Android App Porting Plan (Pre-V1)

**Scope boundary:** this document covers *only* porting the existing, working NARI frontend into a real installable Android app with native background location and native push. It does **not** cover v1 features (memory versioning, reflection, identity layer, Bridge/Globe UI) — those come after this is done and stable. Do not implement anything from the intelligence/UX redesign as part of this work.

**Target platform:** Android only. No iOS work, no iOS-specific code paths.

**Approach:** Capacitor wrapping the existing React/Vite frontend — not a rewrite, not React Native, not a Kotlin/Java native rewrite. The existing frontend (~11,000 lines, ~90 files) should be usable inside the Capacitor WebView with minimal changes. Two specific subsystems get real native replacements (below); everything else should port unchanged.

---

## Decisions already made — do not re-litigate these

- Capacitor over full native or React Native. Rationale: background location and push are available as real native plugins; a full rewrite would mean maintaining two parallel frontend codebases indefinitely for no added capability.
- Continuous live location tracking (not geofence-only). The user wants an always-current position, not just enter/exit events for saved zones.
- A persistent foreground-service notification is accepted and expected — Android requires this for any app doing continuous background location; this is not something to try to avoid or hide.
- Battery/OS-permission tradeoffs of background location are accepted.

---

## Phase A — Capacitor shell

**Goal:** the existing app running as an installable native Android app, functionally identical to the current PWA, no new capability yet.

Tasks:
1. Add Capacitor to the existing `frontend/` project (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`). Do not create a separate project — Capacitor wraps the existing Vite build output.
2. Configure `capacitor.config.ts` — app ID, app name (`NARI`), web dir pointing at the existing Vite `dist` output.
3. Generate the Android project (`npx cap add android`), verify it builds and installs via `npx cap run android` / Android Studio on a real device or emulator.
4. Verify every existing page loads and functions correctly inside the native WebView: Tasks, Notes, Goals, Habits, Reminders, Study, Subjects, Activity, Analytics, Context, Today, Weather, Login. These are pure CRUD/data pages with no browser-specific dependencies and should require no code changes — treat any breakage here as a bug to fix, not an expected cost of porting.
5. Verify `useSyncEngine.js` (IndexedDB-based offline sync) and `websocket.js` (WebSocket + reconnect logic) work unchanged inside the WebView — both use standard web APIs available in Capacitor's WebView, no native plugin needed.
6. **Auth check — do not assume this works, verify it explicitly.** `auth.py`'s `/auth/session` endpoint sets an `HttpOnly`, `SameSite=strict` cookie. Capacitor apps load from a non-standard origin (typically `https://localhost` via the Capacitor WebView, not a real domain), and `SameSite=strict` cookie behavior in that context is not guaranteed to match browser behavior. Test this specifically: does the session cookie get set and sent correctly on subsequent API calls from inside the native app? If not, the fallback is Capacitor's secure storage (`@capacitor/preferences`, not `localStorage`) holding the API key directly and attaching it as an `Authorization` header instead of relying on the cookie flow. Report which path was needed rather than silently picking one.
7. Icons/splash screen: reuse existing PWA icons (`icons/icon-192.png`, `icons/icon-512.png`) and `#020617` background color already defined in `vite.config.js`'s manifest — no new asset design needed for this phase.

**Do not touch in this phase:** `useSpatialAwareness.js`, `push_service.py`, the service worker (`sw.js`) beyond what's noted in Phase D.

---

## Phase B — Native background location

**Goal:** replace browser-based GPS polling with real native continuous tracking that works regardless of whether the app is in the foreground.

Tasks:
1. Add `capacitor-background-geolocation` (the maintained community plugin providing real native background tracking — not the bare `@capacitor/geolocation` plugin, which does not run in the background).
2. Implement the required two-step Android permission flow: request `ACCESS_FINE_LOCATION` first, then separately request `ACCESS_BACKGROUND_LOCATION` (Android requires these as distinct prompts; do not attempt to request both at once, the OS will reject it).
3. Configure the plugin for continuous tracking with distance-filtering and activity-recognition-based throttling (fire updates on meaningful movement, not on a fixed timer) — this is what keeps continuous tracking battery-reasonable. Do not implement a naive `setInterval` GPS poll.
4. Implement the required Android foreground service with a persistent notification. Notification text should read something like **"NARI is aware of your journey"** rather than a generic system string — keep it consistent with the product's tone rather than treating it as boilerplate.
5. **Reuse existing logic, don't rewrite it:** the distance/zone-snap math already in `useSpatialAwareness.js` (`getDistance`, the Haversine calculation, the "is this point within a saved LocationNode's radius" check) is plain JS and should be reused as-is against the new native location stream — only the *source* of position data changes (native plugin callback instead of `navigator.geolocation` polling), not the math that decides what to do with it.
6. Replace the browser `Notification` API calls (`triggerProactiveNotification` in `useSpatialAwareness.js`) with Capacitor's native Local Notifications plugin for the "entered a saved zone" alert.
7. Add a new lightweight backend sync: on each meaningful location update (recommend: every 30-60 seconds *or* on a meaningful distance threshold, whichever comes first — do not sync on every single native location callback, that's unnecessary write load for a single-user SQLite backend), POST the current position to the backend and upsert it into a single "current location" record — this is live state, not a growing log table. If the `awareness_snapshots` table from the v1 plan doesn't exist yet at the time this is implemented, create a minimal standalone table for this now (`current_location: latitude, longitude, updated_at`) rather than blocking this phase on v1 schema work; the v1 awareness layer can read from it later.
8. Handle offline gracefully: buffer location updates locally (reuse the existing IndexedDB sync engine pattern) if the backend is unreachable, flush when connectivity returns. Do not drop location data just because the home server is briefly unreachable.
9. Document the required one-time manual setup step in whatever README/setup notes accompany this work: on OEM Android skins with aggressive battery management (Xiaomi/MIUI, Samsung, OnePlus, Oppo, etc.), the user needs to manually disable battery optimization for NARI and, on some OEMs, enable "autostart." This is expected and not a bug to try to code around.

---

## Phase C — Push notification migration

**Goal:** replace the current self-hosted VAPID/Web Push implementation with native Android push, since Web Push does not work the same way in a native WebView context.

Tasks:
1. Set up a Firebase project and enable Firebase Cloud Messaging (FCM) — required for Android native push regardless of Capacitor.
2. Add `@capacitor/push-notifications`.
3. Backend change: `push_service.py` currently generates VAPID keys and calls `pywebpush` against browser push subscription objects. Add FCM support as a parallel path (store FCM device tokens, send via FCM's API) — do **not** delete the existing VAPID/webpush code as part of this phase. The web/PWA version is planned for eventual retirement once the native app has proven itself, but is still the only fallback interface during that transition, so it needs to keep working until then.
4. Leave the service worker's `push` event listener in place — it's dead code inside the Capacitor build itself, but still needed for the browser/PWA path during the transition period.
5. **Do not remove VAPID/webpush, the service worker's push handling, the CORS entries for the web frontend, or the browser-based auth cookie flow until the web version is actually being retired.** Suggested retirement criterion: the native app has been used as the daily driver for a couple of weeks with no incident requiring the web fallback — not simply "the app installs and opens successfully." Treat that cleanup as a separate, later piece of work, not part of this porting phase.

---

## Phase D — Cleanup

**Goal:** remove redundancy introduced by having both the old PWA caching strategy and the new native app, without breaking either.

1. In the Capacitor build specifically, Workbox's asset precaching (`sw.js`'s `precacheAndRoute`) is redundant — Capacitor bundles web assets directly into the APK at build time, so there's no network fetch of `index.html`/JS/CSS to precache. Do not spend effort "porting" this; it can be a no-op inside the native build.
2. Workbox's `runtimeCaching` for `/api/v1/*` (NetworkFirst, 24h cache) overlaps in purpose with `useSyncEngine.js`'s IndexedDB-based offline sync. Once the native app is confirmed working, evaluate consolidating to one offline strategy rather than running both — but do not do this consolidation *during* the port; get the port working first, simplify after.

---

## Explicitly out of scope for this work

- Memory versioning, reflection job, identity profile, awareness snapshot schema beyond the minimal current-location table noted in Phase B step 7.
- The Bridge / Globe / new visual design.
- iOS, in any form.
- Rewriting any CRUD page or hook not listed above as needing changes.

## Report back on, rather than silently deciding

- Which auth path was needed in Phase A step 6 (cookie worked as-is vs. needed the token/header fallback).
- Confirm before starting: pull the current state of the actual repository rather than assuming this document's file-level observations (e.g. what exists in `models/`, `services/`) are still accurate — some backend work may already be ahead of what's described here. This plan's *phases and decisions* hold regardless; only specific file/line references should be re-verified against the real repo before editing them.

## Known plan, not open question
The web/PWA version will eventually be retired in favor of the native app, but only after the native app is proven stable in daily use (see the retirement criterion in Phase C). Nothing web-facing should be removed as part of this porting work.
