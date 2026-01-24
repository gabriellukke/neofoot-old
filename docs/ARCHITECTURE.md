# Neofoot – Architecture Guide

This document defines the authoritative architecture of the Neofoot project.
Any AI-generated code must follow these rules.

---

## 1. Runtime Model (IMPORTANT)

Neofoot is a Tauri desktop application using SvelteKit in SPA mode.

- ssr = false
- prerender = false
- There is no SvelteKit server runtime in production
- All UI code runs in the WebView (client)
- The only backend is Tauri (Rust) via invoke

Do NOT use:
- +page.server.ts
- +layout.server.ts
- $lib/server
- SvelteKit endpoints as a backend

---

## 2. High-Level Architecture

SvelteKit (Client / UI)
  |
  |  invoke()
  v
Tauri Commands (Rust)

Within SvelteKit, code is layered to keep the project testable and maintainable.

---

## 3. Source Code Structure

### 3.1 Routes (UI only)

Path:
  src/routes/

Purpose:
- Pages
- Navigation
- UI composition
- User interaction

Rules:
- No game rules
- No simulation logic
- No direct database access
- Can call use-cases or infra adapters

Example:
  src/routes/lab/match/+page.svelte

---

### 3.2 Shared Library Code

Path:
  src/lib/

This is the internal application library (SvelteKit $lib alias).

---

### 3.3 Domain Layer (Game Rules)

Path:
  src/lib/domain/

Purpose:
- Football simulation rules
- League logic
- Tables, schedules, calculations
- Deterministic algorithms (with seed support)

Rules:
- TypeScript only
- Pure functions
- No Svelte imports
- No Tauri imports
- No filesystem / DB access
- No UI logic

This layer is:
- Fully testable with Vitest
- Independent from UI and backend

Example:
  src/lib/domain/match/simulateMatch.ts

---

### 3.4 Application Layer (Use-Cases)

Path:
  src/lib/app/

Purpose:
- Orchestrate domain logic
- Coordinate workflows
- Prepare data for UI or persistence

Rules:
- Can call domain
- Can call infra
- No UI components
- No direct Svelte imports

Example:
  src/lib/app/match/simulateMatchPreview.ts

---

### 3.5 Infrastructure Layer (Adapters)

Path:
  src/lib/infra/

Purpose:
- Bridge between frontend and Tauri
- Persistence
- External APIs

Rules:
- Can import @tauri-apps/api
- Must not contain game rules
- Must not contain UI logic

Typical responsibility:
- Wrap invoke()
- Abstract Tauri commands behind clean functions

Example:
  src/lib/infra/tauri/match.ts

---

## 4. Rust Backend (Tauri)

Path:
  src-tauri/

Purpose:
- Persistence (SQLite, filesystem)
- Heavy computation
- Optional simulation engine
- Deterministic core logic

Rules:
- Exposed via #[tauri::command]
- No UI concerns
- Can be tested with cargo test

Rust is the backend, not SvelteKit.

---

## 5. Testing Strategy

### 5.1 TypeScript Tests (Vitest)

Used for:
- src/lib/domain/**
- src/lib/app/**

Rules:
- Test logic, not UI
- Environment: node
- Deterministic tests preferred

Example:
  src/lib/domain/match/simulateMatch.test.ts

---

### 5.2 Rust Tests

Used for:
- Match engine
- Algorithms
- Deterministic behavior

Tool:
- cargo test

---

### 5.3 UI Testing

- Not a priority now
- Manual validation via /lab/* routes
- Automated UI tests only when domain is stable

---

## 6. Lab Routes (Debug / Validation UI)

Path:
  src/routes/lab/

Purpose:
- Visual validation
- Debugging
- Algorithm tuning
- Rapid iteration

Rules:
- Allowed to be simple and ugly
- Should call exactly the same logic used by the game
- No duplicated rules

Examples:
- /lab/match
- /lab/league

---

## 7. Absolute Rules for AI-Generated Code

Any AI assistant must follow these rules:

1. Never introduce game logic in src/routes
2. Never introduce Tauri imports in src/lib/domain
3. Never use SvelteKit server features
4. One task = small change
5. Domain logic must be testable
6. UI validates, tests freeze behavior

If a suggestion violates these rules, it must be rejected.

---

## 8. Source of Truth

- Game rules -> src/lib/domain
- Architecture rules -> this document
- Roadmap -> docs/ROADMAP.md