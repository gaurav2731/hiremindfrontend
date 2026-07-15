---
name: project-build-discipline
description: Use this skill whenever building, editing, or extending a real code project for the user (e.g. HireMind AI or any other multi-file app) — whether Claude is writing the code directly or producing a prompt/handoff for another AI coding tool to build it. Trigger this any time files are being created, modified, or an implementation plan is being written, even if the user doesn't explicitly repeat these rules each time. Covers: keeping backend and frontend in separate top-level folders, removing unused/dead code and files, and making only the specific change requested instead of restructuring unrelated parts of the project.
---

# Project Build Discipline

## Purpose

This skill encodes standing rules for how code projects should be built
and edited, so they don't need to be repeated in every request. Apply
these automatically whenever writing code, editing files, or drafting a
prompt/handoff for another AI coding tool to build something.

## Rules (apply every time, without being asked again)

### 1. Backend and frontend stay in separate top-level folders — always
- A project must maintain a clear structure like:
  ```
  project-name/
  ├── backend/
  └── frontend/
  ```
- Never mix backend and frontend files into a shared folder, and never let
  this drift mid-project (e.g. don't suddenly put an API route file inside
  `frontend/` or a React component inside `backend/`, even temporarily,
  even for a "quick fix").
- If a new piece of functionality could arguably go in either place,
  default to keeping the split intact: business logic / data / AI calls →
  `backend/`; UI / presentation → `frontend/`.
- If asked to add a new major piece (e.g. a mobile app, a shared package),
  give it its own top-level folder rather than nesting it inside backend
  or frontend.

### 2. No unused or dead code/files
- Before finishing a build or edit pass, remove:
  - Placeholder/scaffold files that were superseded and are no longer
    referenced
  - Commented-out blocks of old code left behind after a rewrite
  - Unused imports, unused variables, unused functions introduced during
    the change
  - Duplicate files created by mistake (e.g. `Dashboard.jsx` and
    `Dashboard_old.jsx` both existing)
- Do not leave "just in case" files or speculative code that isn't
  connected to anything the project actually uses.
- Exception: intentional placeholders that are part of the agreed phase
  plan (e.g. a Phase 6 endpoint stub in an earlier phase) are fine to
  keep — those aren't "unused," they're deliberately scaffolded and
  should be marked with a clear `TODO` comment stating which phase
  implements them.

### 3. Scoped edits only — change exactly what was asked, nothing else
- When the user (or a task instruction) asks for a specific change, make
  that change and stop. Do not:
  - Refactor unrelated files "while you're in there"
  - Rename variables, reorganize folders, or change formatting in files
    untouched by the actual request
  - Upgrade dependencies or change config unrelated to the requested
    change
- If a broader change seems genuinely necessary to correctly implement
  the request (e.g. the requested feature can't work without touching a
  shared file), say so explicitly and explain why, rather than silently
  expanding scope.
- When summarizing a change, list exactly which files were touched and
  why — so scope creep is visible and easy to catch.

### 4. Clean code standards
- **Naming:** variables, functions, and files must describe what they
  actually do/hold — no `data2`, `temp`, `foo`, `handleClick1`. Match the
  existing project's naming convention (e.g. `snake_case` for Python,
  `camelCase` for JS/React) rather than mixing styles.
- **Function size/responsibility:** a function should do one clear thing.
  If a function is handling parsing, validation, and DB writes all at
  once, split it rather than letting it grow.
- **No magic numbers/strings:** use named constants (e.g. `MAX_UPLOAD_MB`)
  instead of bare literals scattered through the code.
- **Comments explain "why," not "what":** avoid comments that just restate
  the code (`# increment counter` above `counter += 1`). Add comments
  where the reasoning isn't obvious from the code itself (e.g. why a
  particular workaround exists).
- **Consistent formatting:** follow the formatter/linter already
  configured in the project (e.g. Prettier/ESLint for JS, Black/Ruff for
  Python). If none exists yet for a new project, set up a sensible
  default rather than leaving formatting ad hoc.
- **Error handling is explicit:** don't silently swallow exceptions
  (`except: pass` / empty `catch` blocks). Handle errors meaningfully or
  let them propagate with a clear message.
- **No duplicated logic:** if the same block of logic appears in more than
  two places, extract it into a shared function/module instead of
  copy-pasting.

### 5. Testing is required, not optional
- **Backend:** every new endpoint or service function that contains real
  logic (not a placeholder stub) should get at least one test — happy
  path plus at least one failure/edge case (e.g. invalid input, missing
  auth, empty file). Use the project's existing test framework (e.g.
  Pytest + FastAPI's `TestClient`, as already set up in this project).
- **Frontend / DOM testing:** every new interactive component (forms,
  buttons that trigger actions, conditional UI states) should get a test
  that renders it and verifies the DOM behaves as expected — e.g. using
  React Testing Library + Vitest/Jest (already configured in this
  project's `package.json`). At minimum, verify:
  - The component renders without crashing
  - Key interactive elements are present and accessible (e.g. via
    `getByRole`/`getByText`, not brittle selectors like raw class names)
  - User interactions (click, type, submit) produce the expected DOM
    change or trigger the expected function call (use mocks for API
    calls rather than hitting a real backend in unit tests)
- **Don't test implementation details.** Test observable behavior (what
  the user sees/can do), not internal state or private functions — this
  keeps tests stable when refactoring internals.
- **Placeholder/stub endpoints from the phase plan** (e.g. Phase 6/8
  features not yet implemented) don't need full tests yet — just confirm
  they return the expected "not implemented" response, if that's checked
  at all.
- **Before marking a build/edit task done, tests must actually be run**,
  not just written — report pass/fail, don't assume.

## When drafting prompts/handoffs for other AI coding tools

Since the user may hand work to another AI builder (not just have Claude
write the code directly), any handoff prompt produced under this skill
must explicitly state these rules to the receiving tool, e.g.:

> - Keep backend and frontend in separate top-level folders — do not mix
>   or restructure this.
> - Remove any unused/dead files or code you create or encounter as part
>   of this change — don't leave scaffolding behind.
> - Only change what is specifically requested in this task. Do not
>   refactor, rename, or restructure unrelated files. If a broader change
>   seems required, stop and ask first instead of proceeding.
> - Follow clean code practices: clear naming, single-responsibility
>   functions, no magic numbers, explicit error handling, no duplicated
>   logic, and match the project's existing formatting/linting setup.
> - Write tests for what you build: backend logic gets Pytest coverage
>   (happy path + at least one edge case); frontend interactive components
>   get DOM-level tests (React Testing Library or equivalent) verifying
>   rendering and user interaction behavior, not internal implementation
>   details. Actually run the tests and report pass/fail before calling
>   the task done.

## Self-check before considering a build/edit task done

- [ ] Is there still a clean `backend/` vs `frontend/` (or equivalent)
      top-level split?
- [ ] Did I remove any file/code that is no longer referenced or needed?
- [ ] Did I touch only the files necessary for the specific request?
- [ ] If I touched something outside that scope, did I explicitly flag
      and justify it rather than doing it silently?
- [ ] Does new code follow clean naming, single-responsibility functions,
      no magic numbers, and explicit error handling?
- [ ] Does new backend logic have Pytest coverage (happy path + edge case)?
- [ ] Does new interactive frontend UI have a DOM-level test verifying
      render + interaction behavior?
- [ ] Did I actually run the tests (not just write them) and confirm they
      pass?