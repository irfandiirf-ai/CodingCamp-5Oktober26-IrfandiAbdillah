# Implementation Plan: To-Do List Dashboard

## Overview

Build a self-contained, three-file client-side SPA (index.html, css/style.css, js/app.js) using pure HTML5, CSS3, and Vanilla JavaScript. The application delivers five interactive areas — a live clock with personalized greeting, dark/light theme switching, a Pomodoro focus timer, a full-CRUD task manager with duplicate prevention, and a quick-links panel — with all state persisted to localStorage. Implementation follows the module-per-widget IIFE architecture defined in the design document.

---

## Tasks

- [x] 1. Scaffold the three-file project structure
  - Create `index.html` with the full semantic HTML skeleton: `<head>` with charset, viewport meta, title, and `<link>` to `css/style.css`; `<body>` containing theme toggle button and the four widget sections (`#clock-widget`, `#timer-widget`, `#todo-widget`, `#links-widget`) with all required element IDs matching the design's DOM binding tables; closing `<script src="js/app.js">` tag
  - Create `css/style.css` as an empty file (populated in Task 9)
  - Create `js/app.js` as an empty file (populated in subsequent tasks)
  - Verify the three files exist at their exact paths and no fourth file is introduced
  - _Requirements: 12.1, 12.2, 12.5_

- [x] 2. Implement the utility layer and constants in `js/app.js`
  - [x] 2.1 Define module-level constants
    - Declare `LS_TASKS = "tld_tasks"`, `LS_LINKS = "tld_links"`, `LS_THEME = "tld_theme"`, `LS_NAME = "tld_username"`, `TIMER_DURATION = 1500` (25 × 60 seconds)
    - Declare `DEFAULT_LINKS` array containing at least three preset Link objects (Google, GitHub, YouTube, MDN Docs) with hardcoded `id`, `title`, and `url` fields matching the design spec
    - _Requirements: 8.2, 8.3, 13.5, 14.2_

  - [x] 2.2 Implement `uid()`, `pad2()`, `lsGet()`, and `lsSet()`
    - Write `uid()` generating a collision-resistant string via `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)`
    - Write `pad2(n)` returning `String(n).padStart(2, "0")`
    - Write `lsGet(key, fallback)` wrapping `localStorage.getItem` + `JSON.parse` in `try/catch`; return `fallback` when the key is absent (`null`) or JSON parsing throws
    - Write `lsSet(key, value)` wrapping `JSON.stringify` + `localStorage.setItem` in `try/catch`; silently absorb `QuotaExceededError` and any other exception
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 2.3 Write property tests for `lsGet` and `lsSet` (Properties 7, 8, 9, 10)
    - **Property 7: localStorage round-trip for tasks preserves all fields** — generate arbitrary Task arrays via fast-check; write with `lsSet`; read back with `lsGet`; assert each element's `id`, `text`, `completed`, `createdAt` are identical
    - **Property 8: localStorage round-trip for links preserves all fields** — same pattern for Link arrays; assert `id`, `title`, `url`
    - **Property 9: lsGet returns fallback for all non-parseable inputs** — generate arbitrary non-JSON strings; set directly via `localStorage.setItem`; assert `lsGet` returns the fallback without throwing
    - **Property 10: lsSet never throws on write failure** — mock `localStorage.setItem` to throw; assert `lsSet` completes without exception
    - Run ≥ 100 iterations per property using fast-check
    - Tag each test: `// Feature: todo-list-dashboard, Property N: <title>`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 3. Implement the Clock Widget and Custom Name Greeting (`initClock` IIFE)
  - [x] 3.1 Implement `getGreeting(hour)` and the `tick()` function
    - Write `getGreeting(hour)` mapping integer 0–23 to one of four canonical greeting strings using the boundary table: 05–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–23 and 00–04 → "Good Night"
    - Write `tick()` to: read `new Date()`, format `HH:MM:SS` using `pad2`, write to `#clock`; format a long-form date string using `toLocaleDateString` with `{ weekday:"long", year:"numeric", month:"long", day:"numeric" }` and write to `#date-display`; call `getGreeting(hour)` and write result to `#greeting`
    - Wrap functions in the `initClock` IIFE; call `tick()` immediately on load, then schedule it with `setInterval(tick, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 3.2 Write property tests for `getGreeting` (Properties 1 and 2)
    - **Property 1: Greeting correctness for all hours** — for every integer in [0, 23], assert the return value is exactly one of the four canonical strings and is determined solely by the correct hour range; assert no hour maps to two greetings
    - **Property 2: Greeting boundary coverage** — for every integer in [0, 23], assert `getGreeting(hour)` returns a non-empty string (exhaustive coverage, no unhandled hour)
    - Run ≥ 100 iterations
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [x] 3.3 Implement Custom Name Greeting (Challenge Feature)
    - Initialize `currentName` from `localStorage.getItem(LS_NAME) || "Guest"` and render into `#user-name`
    - Implement `changeName()`: prompt user for a new name; trim input; fall back to `"Guest"` if empty or cancelled; update `#user-name` and write to `localStorage.setItem(LS_NAME, currentName)`
    - Bind click listeners on `#user-name` and `#btn-edit-name` to `changeName()`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 3.4 Write unit test for Custom Name Greeting fallback
    - Assert that empty input, whitespace, or prompt cancellation defaults safely to `"Guest"`
    - _Requirements: 14.5_

- [x] 4. Checkpoint — Verify utility, clock, and name greeting layers
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the Focus Timer (`initTimer` IIFE)
  - [x] 5.1 Implement private state, `render()`, and `setRunningState()`
    - Declare private variables: `remaining = TIMER_DURATION`, `intervalId = null`, `running = false`
    - Implement `render()` to format `remaining` as `MM:SS` using `pad2` and write to `#timer-display`
    - Implement `setRunningState(isRunning)` to toggle the `.running` CSS class on `#timer-display` and set the `disabled` attribute on `#btn-start` when running; call `render()` at the end
    - _Requirements: 2.1, 2.2, 2.9, 2.10_

  - [x] 5.2 Implement `start()`, `pause()`, `stop()`, `reset()`, and `notifyComplete()`
    - `start()`: guard `if (running) return`; if `remaining === 0` reset to `TIMER_DURATION`; set `running = true`, assign `intervalId = setInterval(...)` decrementing `remaining` each tick; on each tick call `render()` and check for 0 → call `stop()` then `notifyComplete()`; call `setRunningState(true)`
    - `pause()`: guard `if (!running) return`; clear interval, set `running = false`, call `setRunningState(false)`
    - `stop()` / `reset()`: clear interval, set `running = false`, set `remaining = TIMER_DURATION`, call `setRunningState(false)` and `render()`
    - `notifyComplete()`: fire `setTimeout(() => alert("Focus session complete! Take a break."), 50)`
    - Wire click handlers to `#btn-start`, `#btn-pause`, `#btn-stop`, `#btn-reset`
    - Call `render()` immediately on load
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 6. Implement the Task Manager with Duplicate Prevention (`initTodoList` IIFE)
  - [x] 6.1 Implement state initialization, `createTaskElement()`, and `renderTasks()`
    - Load `tasks` from `lsGet(LS_TASKS, [])`; if result is not an array, reassign to `[]`
    - Implement `createTaskElement(task)` returning an `<li>` containing: a checkbox (checked state = `task.completed`), a `<span>` for task text with `.completed` class when `task.completed` is true, an Edit button, and a Delete button; bind toggle, edit, and delete handlers inline
    - Implement `renderTasks()` clearing `#task-list` innerHTML and appending `createTaskElement(t)` for each task; call on load
    - Declare `editingId = null`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Implement `addTask()` with Duplicate Prevention (Challenge Feature)
    - Read `#task-input` value; if trimmed is empty → `showError(#task-error, #task-input, "Task cannot be empty.")`
    - Check duplicate: compare `text.toLowerCase()` against existing tasks; if duplicate found → `showError(#task-error, #task-input, "This task already exists.")`
    - If valid, create Task object (`uid()`, trimmed text, `completed: false`, ISO timestamp), push to `tasks`, append to DOM, clear input, call `saveTasks()`, `clearError()`
    - Bind `#btn-add-task` click and Enter keydown on `#task-input`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.3 Write property tests for `addTask` (Properties 3 and 4)
    - **Property 3: Whitespace task rejection** — generate arbitrary whitespace-only strings; attempt add; assert `tasks.length` unchanged and storage unchanged
    - **Property 4: Task addition round-trip** — generate arbitrary non-whitespace-only strings; add task; assert `lsGet(LS_TASKS, [])` last element has valid text, `completed === false`, non-empty `id`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 6.4 Implement `toggleTask()`, `deleteTask()`
    - `toggleTask(id)`: find task by id; flip `task.completed`; update checkbox and strikethrough class; call `saveTasks()`
    - `deleteTask(id)`: filter `tasks` array removing matching id; remove corresponding element from DOM; call `saveTasks()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.5 Write property tests for `toggleTask` and `deleteTask` (Properties 5 and 6)
    - **Property 5: Toggle completion is an involution** — assert toggle twice restores original completion state
    - **Property 6: Task deletion removes from both memory and storage** — assert element is removed completely
    - _Requirements: 6.2, 6.3, 6.5, 7.2, 7.3, 7.4_

  - [x] 6.6 Implement `openEditModal()`, `saveEdit()` with Duplicate Prevention, and `closeEditModal()`
    - `openEditModal(id)`: set `editingId = id`; find task; populate `#edit-task-input`; clear error; show `#edit-modal`
    - `saveEdit()`: read `#edit-task-input`; if empty → `showError`; check if text matches another existing task (`t.id !== editingId && t.text.toLowerCase() === text.toLowerCase()`) → `showError(#edit-error, #edit-task-input, "Another task already has this name.")`
    - If valid, update `task.text`, update DOM, call `saveTasks()`, call `closeEditModal()`
    - `closeEditModal()`: hide `#edit-modal`, clear `editingId`
    - Wire buttons, backdrop click, and Escape key listeners
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 6.7 Write unit test for Duplicate Task Prevention
    - Test adding duplicate string (case-insensitive) fails with error
    - Test editing task to match an existing task fails; test saving unchanged text succeeds
    - _Requirements: 3.8, 5.8, 5.9_

- [x] 7. Checkpoint — Verify Task Manager
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement the Quick Links Panel (`initQuickLinks` IIFE)
  - [x] 8.1 Implement state initialization, `createLinkElement()`, and `renderLinks()`
    - Load `links` from `lsGet(LS_LINKS, null)`; if null/non-array, set `links = [...DEFAULT_LINKS]` and call `saveLinks()`
    - Implement `createLinkElement(link)` returning a card with anchor (`target="_blank"`, `rel="noopener noreferrer"`) and Delete button
    - Implement `renderLinks()` on load
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Implement `addLink()`, `deleteLink()`, `saveLinks()`, `showError()`, `clearErrors()`
    - `addLink()`: read inputs; validate non-empty; auto-prepend `https://` if missing; push to `links`, append to DOM, clear inputs, call `saveLinks()`
    - `deleteLink(id)`: remove link by id, remove from DOM, call `saveLinks()`
    - Bind `#btn-add-link` click
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2_

  - [x] 8.3 Write property tests for `addLink` (Property 11)
    - **Property 11: Link addition round-trip** — verify non-empty title and url correctly append and persist
    - _Requirements: 9.2, 9.3_

- [x] 9. Implement Theme Manager & Layout CSS in `css/style.css` (Challenge Feature)
  - [x] 9.1 Implement Theme Manager (`initTheme` IIFE) in `js/app.js`
    - Read `savedTheme` from `localStorage.getItem(LS_THEME) || "dark"`
    - Implement `applyTheme(theme)`: set `document.documentElement.setAttribute("data-theme", theme)`, toggle button text (`🌙` / `☀️`), write to `localStorage.setItem(LS_THEME, theme)`
    - Bind click listener on `#theme-toggle` to switch theme between dark and light
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 9.2 Implement CSS custom properties for Light & Dark mode
    - Define default dark variables on `:root` and override with `[data-theme="light"]` variables for background, widget cards, text, borders, and input fields
    - Implement standard `background-clip: text` alongside `-webkit-background-clip: text` for browser compatibility
    - _Requirements: 12.1, 12.3, 13.3_

  - [x] 9.3 Implement balanced 2-column dashboard layout
    - Style container with CSS Grid (`left-timer`, `left-links`, `right-todo`) ensuring visual balance without empty gaps
    - Style widgets with glassmorphism (`backdrop-filter: blur(16px)`), border radius, and subtle shadows
    - _Requirements: 12.1, 12.3_

  - [x] 9.4 Implement responsive breakpoints and accessibility
    - At ≤ 820px viewport: stack into single column
    - Ensure `:focus-visible` outline on interactive controls
    - _Requirements: 12.4_

- [x] 10. Checkpoint — Full integration smoke-test
  - Open `index.html` in browser: verify clock, theme toggle, name edit, timer, task duplicate block, link addition, and localStorage persistence across page reloads.

- [x] 11. Property-based and unit test verification
  - [x] 11.1 Run unit and property tests
    - Verify fast-check tests (≥ 100 iterations each) and unit test coverage
    - Ensure zero regressions across base and challenge requirements
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 12. Cross-browser verification and final constraint audit
  - [x] 12.1 Verify functional correctness across Chrome, Firefox, Edge, and Safari
  - [x] 12.2 Verify zero external CDN/font links and strictly 3 project files (`index.html`, `css/style.css`, `js/app.js`)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

---


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references the specific requirement clauses it satisfies for full traceability
- Checkpoints (Tasks 4, 7, 10) are natural synchronization points — pause and verify before continuing
- The PBT suite (Task 11) requires Node.js/npm for Jest + fast-check; the application itself has zero runtime dependencies
- Property tests validate universal correctness; unit tests in Jest+jsdom validate DOM integration and specific examples
- All 11 design Correctness Properties must be covered before marking Task 11.3 complete

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1"] },
    { "id": 1, "tasks": ["2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 4, "tasks": ["3.4", "5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5", "6.6"] },
    { "id": 8, "tasks": ["6.7", "8.1"] },
    { "id": 9, "tasks": ["8.2"] },
    { "id": 10, "tasks": ["8.3", "9.1"] },
    { "id": 11, "tasks": ["9.2"] },
    { "id": 12, "tasks": ["9.3"] },
    { "id": 13, "tasks": ["9.4"] },
    { "id": 14, "tasks": ["10"] },
    { "id": 15, "tasks": ["11.1"] },
    { "id": 16, "tasks": ["12.1", "12.2"] }
  ]
}
```
