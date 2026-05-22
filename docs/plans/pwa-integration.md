# NARI PWA Integration Plan: Neural Offline Protocol

## Objective
Transform NARI into a Progressive Web App (PWA) to enable:
1.  **Mobile Installation:** Add to Home Screen (A2HS) for a native app-like experience.
2.  **Offline Productivity:** Access cached notes, tasks, and analytics without an active internet connection.
3.  **Background Sync:** Queue state changes (e.g., completing a task) while offline and sync when reconnected.

---

## Phase 1: Infrastructure Setup
### 1.1 Install Dependencies
Add `vite-plugin-pwa` to handle service worker generation and manifest management.
```bash
cd frontend
npm install -D vite-plugin-pwa
```

### 1.2 Asset Preparation
Create high-resolution icons in `frontend/public/icons/`:
- `pwa-192x192.png`: Standard Android/Chrome icon.
- `pwa-512x512.png`: Large splash screen icon.
- `apple-touch-icon.png`: For iOS compatibility.
- `favicon.svg`: Vector source for the neural logo.

---

## Phase 2: Configuration (Vite)
Modify `frontend/vite.config.js` to integrate the PWA plugin.

### 2.1 Web App Manifest
Define the "Neural Identity" of the app:
- **Name:** NARI (Not A Random Intelligence)
- **Short Name:** NARI
- **Theme Color:** #000000 (OLED Black)
- **Background Color:** #000000
- **Display:** `standalone` (removes browser UI)

### 2.2 Service Worker Strategy
Use **Workbox** with the following caching logic:
-   **Static Assets (CSS, JS, Images):** `StaleWhileRevalidate` (Serve from cache, update in background).
-   **API Routes (`/api/v1/*`):** `NetworkFirst` (Try network for fresh data, fallback to cache for offline).
-   **Pre-caching:** Automatically cache all build artifacts for instant startup.

---

## Phase 3: UI Integration
### 3.1 Reload/Offline Notification
Implement a "Reload Prompt" component in `App.jsx` to notify users when a new version of the PWA is available (Auto-update strategy).

### 3.2 Installation Prompt
Create a "Neural Install" button in the Settings page or Sidebar that triggers the `beforeinstallprompt` event for users who haven't installed the app yet.

### 3.3 Offline State Indicators
Add a subtle "Offline Mode" badge to the header when the browser loses connectivity (`navigator.onLine`).

---

## Phase 4: Data Persistence (Future)
- **IndexedDB:** Use `idb` or `dexie` to store API responses locally.
- **Background Sync API:** Register sync events to push queued updates to the Python backend once connectivity returns.

---

## Implementation Checklist
- [ ] Install `vite-plugin-pwa`.
- [ ] Configure `manifest` in `vite.config.js`.
- [ ] Generate 192x192 and 512x512 PNG icons.
- [ ] Register Service Worker in `main.jsx`.
- [ ] Verify "Installable" status in Chrome DevTools Lighthouse.
- [ ] Test offline access on mobile devices (Server-01 IP).
