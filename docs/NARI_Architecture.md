# NARI Technical Architecture Document

**Version:** v1.0.0-alpha.7  
**Status:** In Development (Stage 9 Transition)  
**Last Updated:** 2026-05-22  
**Author:** Ankit (Solo Developer)  
**System Type:** Self-hosted personal productivity and intelligence platform  
**Primary Server:** Server-01 (Intel i5-2400S, 8GB RAM, 500GB HDD)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Hardware Profile](#2-hardware-profile--server-01)
3. [Design Principles](#3-design-principles)
4. [Finalized Tech Stack](#4-finalized-tech-stack)
5. [Folder Structure](#5-folder-structure)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Response Contract](#9-response-contract)
10. [Neural Intelligence Protocols](#10-neural-intelligence-protocols)
11. [WebSocket Event Map](#11-websocket-event-map)
12. [ActivityLog Specification](#12-activitylog-specification)
13. [Build Order & Milestones](#13-build-order--milestones)
14. [Deployment Setup — Server-01](#14-deployment-setup--server-01)
15. [Engineering Rules](#15-engineering-rules)
16. [AI Layer — Reserved (Stage 9)](#16-ai-layer--reserved-stage-9)
17. [Future Roadmap](#17-future-roadmap)

---

## 1. Project Overview

NARI (Not A Random Intelligence) is a local-first, self-hosted personal operating system for one person. It combines task management, study tracking, notes, goals, habits, reminders, and analytics into a single system that runs permanently on Server-01 and is accessible from any desktop device on the home network via browser.

**Core philosophy:**
- NARI should learn the user's patterns and grow with them over time.
- Every action is logged from day one — behavioral data accumulates before AI arrives.
- The system is usable without AI forever; AI only enhances, never controls.
- Each build stage must end with something in daily use.

---

## 2. Hardware Profile — Server-01

| Spec | Value |
|---|---|
| Name | **Server-01** |
| CPU | Intel Core i5-2400S (4 cores, 2.5GHz) |
| RAM | 8GB DDR3 |
| Storage | 500GB HDD |
| OS | Ubuntu Server 24.04 LTS |

---

## 3. Design Principles

1. **Local-first** — Data stays on Server-01.
2. **API-first** — All clients use the same REST API.
3. **AI-ready** — Designed for easy LLM integration.
4. **Time-aware** — Full historical tracking with UTC timestamps.
5. **ActivityLog Always** — Append-only audit trail for all state changes.

---

## 4. Finalized Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.12)
- **ORM:** SQLModel (SQLite with WAL Mode)
- **Migrations:** Alembic
- **Scheduler:** APScheduler

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **State:** Zustand (UI) + TanStack Query (Server)
- **Icons:** Lucide React

---

## 5. Folder Structure

- `backend/app/api/v1/`: API endpoints.
- `backend/app/services/`: Business logic and ActivityLog emission.
- `backend/app/models/`: SQLModel table definitions.
- `backend/app/schemas/`: Pydantic models for API validation.
- `frontend/src/components/`: Modular React components.
- `cli/`: Python thin-client for terminal control.

---

## 6. Environment Variables

Managed via `backend/.env`. Key variables:
- `NARI_API_KEY`: Neural Handshake secret.
- `DATABASE_URL`: Path to SQLite DB.
- `NARI_TIMEZONE`: User local timezone (e.g., Asia/Kolkata).

---

## 7. Database Schema

All models inherit from `NariBase` (id, created_at, updated_at).
Key Tables: `tasks`, `reminders`, `notes`, `subjects`, `study_sessions`, `goals`, `habits`, `activity_logs`.

---

## 8. API Design

NARI follows a standard RESTful pattern:
- `GET /api/v1/{resource}`: List resources with filtering.
- `POST /api/v1/{resource}`: Create resource.
- `PATCH /api/v1/{resource}/{id}`: Partial update.
- `DELETE /api/v1/{resource}/{id}`: Soft delete (archived_at).

---

## 9. Response Contract

All responses must adhere to the high-fidelity contract:
```json
{
  "ok": true,
  "data": { ... },
  "error": { "code": "STRING", "message": "Human readable" } 
}
```

---

## 10. Neural Intelligence Protocols

### 10.1 Pre-Flight Intercept
- **Logic:** Frontend polls `/reminders?active_only=true` every 5s.
- **Trigger:** Displays high-priority HUD for upcoming signals within the trigger window.

### 10.2 Ghost Protocol
- **Logic:** Automated resolution for missed signals.
- **Locked-In:** Auto-dismissed after 2 mins of inactivity.
- **Ghosted:** Marked as `MISSED` after 5 mins of user silence.

---

## 11. WebSocket Event Map

- `TASK_UPDATED`: Real-time task status sync.
- `STUDY_STARTED` / `STUDY_STOPPED`: Sync focus timer across devices.
- `REMINDER_TRIGGERED`: Instant browser notification signal.
- `ACTIVITY_LOGGED`: Live update of the Behavioral HUD.

---

## 12. ActivityLog Specification

- **Append-only:** Records `user_id`, `entity_type`, `entity_id`, `action`, and `description`.
- **Integrity:** derivations provided by `ActivityService` if description is missing.

---

## 13. Build Order & Milestones

1. **Stages 0-4:** Foundation (Backend, Tasks, Study, Notes, Dashboard).
2. **Stages 5-8:** Intelligence (WebSockets, Reminders, Vision, Analytics).
3. **Stage 9:** AI Layer (Ollama Integration).

---

## 14. Deployment Setup — Server-01

### 14.1 Neural Upgrade Engine (`update.sh`)
Automates production maintenance with:
- **Defensive Pathing:** Absolute root detection via `BASH_SOURCE`.
- **Robust Permission Protocol:** Recursive 755 (Dir) / 644 (File) calibration + Sudo-hardened binary authorization.

### 14.2 Nginx Configuration
Reverse proxy on port 80, routing `/api` and `/ws` to the FastAPI backend (Port 8000).

---

## 15. Engineering Rules

1. **Routes vs. Services:** Routes call services; services touch DB.
2. **EventBus:** Use for cross-service communication (no direct service-to-service calls).
3. **Audit Rule:** Every state-modifying method MUST write to `ActivityLog`.
4. **File Size:** Max 250 lines per file.

---

## 16. AI Layer — Reserved (Stage 9)

- Local integration with Ollama (Llama 3.1 8B).
- Focus: Pattern reasoning, task suggestions, and natural language command parsing.

---

## 17. Future Roadmap

- Year 2: Plugin system and calendar integration.
- Year 3: Voice input and advanced desktop management.

---

*This document is the single source of truth for NARI architecture. Last Updated: v1.0.0-alpha.7.*
