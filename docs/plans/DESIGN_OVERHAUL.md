# NARI Frontend Redesign: "Living OS" Overhaul

## 1. Core Philosophy
NARI is transitioning from a mobile-first, paginated application to a **desktop-first, modular command interface**. The aesthetic bridges the gap between an advanced cinematic command intelligence and a highly logical, data-dense precision instrument. 

### Key Metaphors:
*   **Precision Instrument:** No unnecessary decoration. Every line and pixel serves a function.
*   **Neural Interface:** The system feels alive. Ambient animations, pulsing borders, and flowing data streams simulate active background processing.
*   **Tactile Workspace:** The user has absolute physical control over the layout.

---

## 2. Aesthetic System

### 2.1 Color Palette (Neural Deep Dark)
*   **Base Background:** `#020617` (Slate 950) - A deep, rich void, avoiding flat black.
*   **Glass Panels (Surfaces):** `rgba(10, 15, 28, 0.7)` with `backdrop-blur(12px)`.
*   **Primary Accent:** `#00C8E8` (Cyan) - Used for AI interaction, active execution, and primary focus.
*   **Secondary Accent:** `#10B981` (Emerald) - Used for system health, success states, and GPS locks.
*   **Borders:** `rgba(0, 242, 255, 0.1)` - Very subtle, thin structural lines.

### 2.2 Typography
*   **Headings / UI Labels:** `Inter` or `Geist` (sans-serif, geometric, tight tracking).
*   **Body / Data / Logs:** `JetBrains Mono` or `Geist Mono`.
*   **Treatment:** Extensive use of uppercase, bold weights, and extreme letter-spacing (`tracking-widest`) for structural labels and metadata.

### 2.3 Motion & Hardware Acceleration
*   **WebGPU Background:** The legacy CSS scanline is replaced with a Three.js TSL Node Material shader (`NeuralBackground.jsx`), rendering fluid, weather-reactive noise directly on the GPU.
*   **Ambient Animation:** Slow `background-position` sweeps, breathing opacity pulses (`0.5s - 3s`), and typing effects for AI responses.
*   **Physics:** `framer-motion` springs for all user interactions (button presses, modal slides) to provide a weighty, tactile feel.

---

## 3. Architectural Shift: The Adaptive Grid

### 3.1 Draggable & Resizable Modules
The static Tailwind grid will be replaced by `react-grid-layout`.
*   Every feature (Tasks, Focus, Context, Analytics) becomes a self-contained Widget component.
*   Users can drag widgets by their header to reposition them.
*   Users can use resize handles to stretch widgets across grid columns/rows.

### 3.2 State Persistence
*   The current layout configuration (an array of objects containing `i`, `x`, `y`, `w`, `h` properties) will be stored in a Zustand store.
*   A debounced effect will save this layout JSON directly to the backend database (attached to the user's settings profile).
*   On load, NARI reconstructs the user's exact customized command center.

---

## 4. Feature Integration (The Widgets)

The new dashboard will feature these modular widgets:

1.  **Execution Core:** The active focus session timer (SVG ring) and play/pause/stop controls.
2.  **Neural Co-Pilot:** The ephemeral command line. Replaces chat history with a single active input and typing-effect response area.
3.  **Ambient Context Stream:** The background log of system events (GPS changes, AI digestions, task completions) styled as a terminal readout.
4.  **Priority Queue:** The actionable task list, sorted by urgency.
5.  **Daily Trajectory:** A chronological timeline of the day's events.
6.  **Spatial Context:** The mini-map radar tracking physical location and GPS nodes.
7.  **Strategic Directives:** High-level goals with animated progress bars.
8.  **Knowledge Vault:** Quick access to recent notes and thoughts.
9.  **System Clusters:** Active subjects and study domains.

---

## 5. Mobile Degradation Strategy
`react-grid-layout` natively supports responsive breakpoints.
*   **Desktop (1200px+):** Full 3-column customizable grid freedom.
*   **Tablet (768px+):** 2-column constrained grid.
*   **Mobile (<768px):** The grid collapses into a 1-column vertical stack. 
    *   Horizontal resizing is disabled.
    *   Widgets are ordered automatically based on their Y-axis position from the desktop layout.
    *   The top HUD nav collapses into a slide-up Command Menu.

---

## 6. Implementation Phases

*   **Phase 1: Architecture & Dependencies**
    *   Install `react-grid-layout`.
    *   Define the base Widget container component (glassmorphism styles, drag handles).
*   **Phase 2: Widget Extraction**
    *   Convert existing hooks (`useTasks`, `useActivity`, etc.) into standalone Widget components.
*   **Phase 3: The Grid Engine**
    *   Implement the main `Dashboard.jsx` grid.
    *   Wire up Zustand state for layout changes.
*   **Phase 4: Persistence**
    *   Create API endpoint for saving layout JSON.
    *   Add debounced sync on layout change.
*   **Phase 5: Refinement**
    *   Finalize mobile styling and touch targets.
    *   Polish entry/exit animations.