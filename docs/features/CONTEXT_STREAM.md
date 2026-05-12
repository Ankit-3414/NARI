# Feature: Context Stream (The NARI Input Pipeline)

## Overview
The **Context Stream** is a frictionless, unstructured daily logging system. It serves as the primary "thought capture" mechanism for NARI, allowing the user to log activities, feelings, and events in raw natural language. 

This feature is the foundational data-gathering layer for **Stage 9 (AI Layer)**. By capturing the rhythm of daily life today, it provides the historical behavioral dataset required for future AI persona development.

## Core Mechanics

### 1. The Database Level (The Foundation)
Context entries are stored in the existing `activity_logs` table. This ensures they are interleaved chronologically with system-generated events (like task completions or study sessions).

- **Entity Type:** `context`
- **Action:** `logged`
- **Timestamp:** Stored in UTC.
- **Payload Structure:** 
  ```json
  {
    "text": "Raw user input string",
    "metadata": {}
  }
  ```

### 2. The Backend Level (The API)
A dedicated, high-performance endpoint handles the intake of raw text.
- **Endpoint:** `POST /api/v1/context`
- **Logic:** 
  1. Accepts raw text.
  2. Emits a `context.logged` event to the internal **EventBus**.
  3. `ActivityService` listens for this event and writes the entry to the `activity_logs` table.

### 3. The CLI Level (The Fast Input)
A low-friction terminal command for quick logging during work or study sessions.
- **Command:** `./nari.sh tell "Your message here"`
- **Behavior:** Makes an asynchronous HTTP POST request to the API and returns immediately.

### 4. The Frontend Level (The Dashboard)
A prominent, simple input field on the dashboard's `TodayPage`.
- **UI Element:** "ContextInput" (AetherForge SaaS/Minimalist style).
- **Interactions:**
  - Submit on `Enter`.
  - Immediate clearing of the input field.
  - Instant update of the **Daily Timeline**.

## Future Evolution (Stage 9: AI Integration)

### Automated Action Routing
The AI will eventually monitor the `context.logged` events to trigger system actions automatically:
- *"I drank water"* -> Automatically checks off the "Drink Water" habit.
- *"Studying physics for 1 hour"* -> Automatically retroactively creates a study session.

### Behavioral Insights
The AI will analyze 6+ months of raw text logs using **Vector Search (RAG)** and **Periodic Summarization** to identify burnout patterns, productivity peaks, and long-term habits that structured data alone cannot capture.

---
*Created: May 12, 2026*
*Status: Stage 8 Foundation*
