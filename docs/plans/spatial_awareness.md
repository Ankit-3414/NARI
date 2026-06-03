# NARI Spatial Awareness: Phased Roadmap

## Phase 1: The "Memory" (Backend Foundation)
*Goal: Teach NARI how to store and relate spatial data.*
- [x] **Database Migration:** Create a `LocationNode` table.
    - Fields: `id`, `label` (Home, Gym), `name` (Address/City), `latitude`, `longitude`, `category`, `radius_meters`.
- [x] **Service Layer:** Build `LocationService` for CRUD operations on saved places.
- [x] **Semantic Association:** Update `Task` and `Note` models to include optional spatial links.
- [x] **AI Intelligence Update:** Update the AI's "Tool Registry" so she can search for nearby saved places.

## Phase 2: The "Eyes" (Map Interface)
*Goal: Provide a high-fidelity visual interface for spatial management.*
- [x] **Map Engine Integration:** Install `react-leaflet` and `leaflet`.
- [x] **Imagery Toggles:** 
    - Layer 1: Standard Vector (OpenStreetMap) for street navigation.
    - Layer 2: Satellite Imagery (Esri World Imagery) for real-world visual confirmation.
    - Layer 3: Hybrid View (Esri World Imagery + Roads and Labels reference overlays) for contextual spatial tracking.
- [x] **The "Pin-Drop" Workflow:** 
    - "Capture Current GPS" button.
    - "Manual Pin Drop" (Click-to-save coordinates).
- [x] **Visual Dashboard:** Dedicated "Spatial View" component showing saved nodes as interactive map icons.

## Phase 3: The "Presence" (Real-time Awareness)
*Goal: Enable the background engine that knows where you are.*
- [x] **Geofencing Engine:** Create `useSpatialAwareness.js` hook to poll browser GPS.
- [x] **Proximity Logic:** Implement Haversine formula to calculate distances to saved nodes.
- [x] **State Management:** Sync current spatial context (nearby nodes) to global store.

## Phase 4: The "Brain" (Zero-Effort Proactivity)
*Goal: Connect location, intent, and tasks without manual tagging.*
- [x] **Semantic Intent Mapping:** Update AI to automatically categorize tasks (e.g., "Buy milk" -> `category: shopping`).
- [x] **Proactive Notifications:** Trigger browser notifications when entering a relevant geofence.
- [x] **AI Context Injection:** Automatically inject current proximity into the AI system prompt (e.g., "User is currently near [Market]").

## Phase 5: Refinement & Advanced Logic
*Goal: Polish and battery optimization.*
- [x] **Adaptive Battery Usage:** Implement variable polling (slower when stationary, faster when moving).
- [x] **Radius Optimization:** Auto-scale radii based on category (e.g., 50m for Home, 300m for Shopping).
- [x] **"When I Reach" Parsing:** Support natural language scheduling (e.g., "Remind me to fix the door when I get home").
