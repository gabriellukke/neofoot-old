# Neofoot – AI Rules (Cursor / Claude / Codex)

These rules are mandatory for any AI-generated changes in this repository.

## 1) Read docs first
- Always read `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` before proposing changes.
- If a request conflicts with these docs, propose an alternative that respects them.

## 2) SvelteKit + Tauri runtime constraints
- This project runs SvelteKit as SPA (`ssr = false`, `prerender = false`).
- Do NOT introduce SvelteKit server features:
  - No `+page.server.ts`, `+layout.server.ts`, `+server.ts`, actions/endpoints as backend
  - No `$lib/server` usage
- The backend is Tauri (Rust) via `invoke`.

## 3) Folder ownership rules
- `src/routes/**` = UI only (composition, user interaction). No game rules.
- `src/lib/domain/**` = pure game rules (TypeScript only). No Svelte/Tauri/DB.
- `src/lib/app/**` = use-cases/orchestration. May call domain + infra.
- `src/lib/infra/**` = adapters (Tauri invoke, persistence). No game rules.
- `src-tauri/**` = Rust backend (commands, DB, heavy compute).

## 4) Change size limits (anti-mess)
- One task = one goal.
- Prefer small patches: max 5 files changed per task.
- Do NOT do “big refactors” and “new features” in the same change.
- If a refactor is needed, create a separate refactor-only change (no behavior changes).

## 5) Testing requirements
- Any new domain/app logic must include automated tests (Vitest).
- Prefer deterministic tests using a `seed` when randomness exists.
- Rust logic must be tested with `cargo test` when added/changed.

## 6) Lab routes are for manual validation
- `/routes/lab/**` pages are allowed to be simple/ugly.
- Lab pages must call existing domain/app logic (no duplicated rules in UI).

## 7) API / types discipline
- Do not invent new entities, fields, or tables without updating the relevant docs.
- Keep types explicit. No `any`. Avoid implicit `unknown` without narrowing.

## 8) Output format for AI work
When implementing a task:
1) Write a short plan (3–6 bullets).
2) List which files will change.
3) Provide the minimal patch.
4) Provide commands to run tests/validation.

If unsure, ask for the file contents instead of guessing.