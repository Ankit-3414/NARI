# NARI PWA Integration: Neural Offline Protocol

## Status

Implemented as Stage 8.5.

NARI is installable as a Progressive Web App and supports offline-first usage for core workflows through service worker caching, IndexedDB persistence, and queued background synchronization.

## Objectives

1. **Mobile installation:** Support Add to Home Screen for an app-like experience.
2. **Offline productivity:** Keep core data available when the network is unavailable.
3. **Background sync:** Queue state changes while offline and sync them when the connection returns.

## Implemented Capabilities

### PWA Infrastructure

- `vite-plugin-pwa` configured in the frontend build.
- Web app manifest configured with NARI identity.
- Static build assets are precached.
- Service worker registration happens through the Vite PWA integration.

### App Identity

- App name: NARI.
- Display mode: standalone.
- Theme and background colors configured for the app shell.
- Icons and touch assets available under `frontend/public`.

### Caching Strategy

- Static assets are cached for fast startup.
- API data is backed by local persistence for offline views.
- The UI exposes offline/online state so the user can tell when NARI is operating locally.

### Local Persistence

- IndexedDB is used for entity caching.
- Core entities such as tasks, notes, goals, habits, and subjects can remain available offline.

### Sync Engine

- Offline mutations are queued.
- Queued actions sync when connectivity returns.
- Reconciliation updates server state and refreshes local views.

## Verification Checklist

- [x] Install `vite-plugin-pwa`.
- [x] Configure the app manifest.
- [x] Add PWA icons and touch assets.
- [x] Register the service worker.
- [x] Verify installability in Chromium-based browsers.
- [x] Verify static offline startup.
- [x] Verify IndexedDB-backed local reads.
- [x] Verify queued writes sync after reconnection.

## Follow-Up Work

- Add broader conflict-resolution behavior for simultaneous edits from multiple devices.
- Expand offline coverage if new feature domains are added.
- Keep the service worker update prompt clear and low-friction.
