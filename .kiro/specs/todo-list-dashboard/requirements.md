# Requirements Document

## Introduction

The To-Do List Dashboard is a client-side single-page application (SPA) built with pure HTML5, CSS3, and Vanilla JavaScript. It provides users with a personal productivity hub featuring a live clock with dynamic greeting, a Pomodoro-style focus timer, a full-CRUD to-do list, and a quick-links panel. All data persists exclusively in the browser's localStorage. No frameworks, build tools, or external dependencies are used. The application must run correctly via `file://` or a simple local HTTP server and be compatible with Chrome, Firefox, Edge, and Safari.

---

## Glossary

- **Dashboard**: The single-page HTML application delivered by `index.html`.
- **Clock_Widget**: The UI component displaying the live digital clock, date, and greeting.
- **Focus_Timer**: The Pomodoro-style countdown timer component.
- **Task_Manager**: The to-do list component supporting full CRUD operations.
- **Quick_Links_Panel**: The component displaying and managing shortcut URL buttons.
- **Theme_Manager**: The UI component responsible for toggling and persisting visual themes.
- **Task**: A data object with properties: `id` (string), `text` (string), `completed` (boolean), `createdAt` (ISO timestamp string).
- **Link**: A data object with properties: `id` (string), `title` (string), `url` (string).
- **localStorage**: The browser-native `window.localStorage` Web Storage API.
- **tld_tasks**: The localStorage key used to persist the Task list as a JSON array.
- **tld_links**: The localStorage key used to persist the Link list as a JSON array.
- **tld_theme**: The localStorage key used to persist the active visual theme mode ("dark" or "light").
- **tld_username**: The localStorage key used to persist the user's custom greeting display name.
- **Default_Links**: A hardcoded fallback array of Link objects used when `tld_links` is absent or unparseable.

---

## Requirements

### Requirement 1: Live Clock and Dynamic Greeting

**User Story:** As a user, I want to see the current time, date, and a contextual greeting so that I am oriented and welcomed when I open the dashboard.

#### Acceptance Criteria

1. THE Clock_Widget SHALL display the current time in `HH:MM:SS` (24-hour) format.
2. WHEN the Dashboard loads, THE Clock_Widget SHALL begin updating the displayed time every 1000 milliseconds using `setInterval`.
3. THE Clock_Widget SHALL display the current date in a human-readable format (e.g., "Monday, July 14, 2025").
4. WHEN the current hour is between 05:00 and 11:59 (inclusive), THE Clock_Widget SHALL display the greeting "Good Morning".
5. WHEN the current hour is between 12:00 and 17:59 (inclusive), THE Clock_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the current hour is between 18:00 and 20:59 (inclusive), THE Clock_Widget SHALL display the greeting "Good Evening".
7. WHEN the current hour is between 21:00 and 04:59 (inclusive), THE Clock_Widget SHALL display the greeting "Good Night".
8. THE Clock_Widget SHALL update the greeting in real time if the clock tick crosses a greeting boundary (e.g., from 11:59 to 12:00).

---

### Requirement 2: Focus Timer (Pomodoro)

**User Story:** As a user, I want a 25-minute focus countdown timer so that I can time my work sessions without leaving the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. THE Focus_Timer SHALL display the remaining time in `MM:SS` format.
3. WHEN the user activates the Start control and the Focus_Timer is not already running, THE Focus_Timer SHALL begin decrementing the displayed time by 1 second every 1000 milliseconds.
4. WHEN the user activates the Pause control and the Focus_Timer is running, THE Focus_Timer SHALL suspend the countdown while preserving the current remaining time.
5. WHEN the user activates the Stop control, THE Focus_Timer SHALL halt the countdown and reset the displayed time to 25:00.
6. WHEN the user activates the Reset control, THE Focus_Timer SHALL halt any active countdown and reset the displayed time to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL halt the countdown automatically.
8. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL notify the user via a browser `alert` or equivalent in-page notification.
9. WHILE the Focus_Timer is running, THE Focus_Timer SHALL disable the Start control to prevent duplicate intervals.
10. WHILE the Focus_Timer is paused or stopped, THE Focus_Timer SHALL enable the Start control.

---

### Requirement 3: To-Do List — Add Task

**User Story:** As a user, I want to add tasks to my list so that I can track things I need to do.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input field and an "Add" button for task entry.
2. WHEN the user submits a non-empty task text and activates the Add control, THE Task_Manager SHALL create a new Task object with a unique `id`, the trimmed input text, `completed: false`, and the current ISO timestamp as `createdAt`.
3. WHEN a new Task is created, THE Task_Manager SHALL append it to the task list and render it in the UI.
4. WHEN a new Task is created, THE Task_Manager SHALL persist the updated task array to localStorage under the key `tld_tasks` as a JSON string.
5. IF the user activates the Add control with an empty or whitespace-only input, THEN THE Task_Manager SHALL NOT create a Task and SHALL display an inline error message or visual indicator.
6. WHEN a Task is successfully added, THE Task_Manager SHALL clear the text input field.
7. WHEN the user presses the Enter key while the text input field is focused, THE Task_Manager SHALL trigger the same add-task action as activating the Add button.
8. IF the user attempts to add a task whose trimmed text matches an existing task in the list (case-insensitive comparison), THEN THE Task_Manager SHALL NOT create a Task and SHALL display an inline duplicate validation error.

---

### Requirement 4: To-Do List — Read / Display Tasks

**User Story:** As a user, I want to see all my tasks when I open the dashboard so that I can review my list.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Task_Manager SHALL read the JSON string stored at localStorage key `tld_tasks` and parse it into a Task array.
2. IF the `tld_tasks` value is absent, null, or fails JSON parsing, THEN THE Task_Manager SHALL initialize with an empty Task array and SHALL NOT throw an unhandled exception.
3. THE Task_Manager SHALL render all Tasks from the in-memory array as list items in the UI.
4. WHILE a Task has `completed: true`, THE Task_Manager SHALL render that task's text with a strikethrough visual style.

---

### Requirement 5: To-Do List — Edit Task

**User Story:** As a user, I want to edit an existing task's text so that I can correct mistakes or update task details.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an Edit control for each rendered Task item.
2. WHEN the user activates the Edit control for a Task, THE Task_Manager SHALL present an editable interface (inline edit field or modal dialog) pre-populated with the Task's current text.
3. WHEN the user confirms the edit with non-empty trimmed text, THE Task_Manager SHALL update the Task object's `text` property in the in-memory array.
4. WHEN a Task's text is updated, THE Task_Manager SHALL re-render the updated Task in the UI.
5. WHEN a Task's text is updated, THE Task_Manager SHALL persist the updated task array to `tld_tasks` in localStorage.
6. IF the user confirms the edit with empty or whitespace-only text, THEN THE Task_Manager SHALL NOT update the Task and SHALL display a validation error.
7. WHEN the user cancels the edit, THE Task_Manager SHALL discard the changes and restore the original text.
8. IF the user confirms the edit with text that matches another existing task in the list other than the task being edited (case-insensitive comparison), THEN THE Task_Manager SHALL NOT update the Task and SHALL display an inline duplicate validation error.
9. IF the user confirms the edit without modifying the original task's text, THEN THE Task_Manager SHALL close the edit interface without treating it as a duplicate.

---

### Requirement 6: To-Do List — Toggle Completion

**User Story:** As a user, I want to mark tasks as complete or incomplete so that I can track my progress.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a Toggle control (e.g., checkbox) for each rendered Task item.
2. WHEN the user activates the Toggle control for an incomplete Task, THE Task_Manager SHALL set that Task's `completed` property to `true`.
3. WHEN the user activates the Toggle control for a completed Task, THE Task_Manager SHALL set that Task's `completed` property to `false`.
4. WHEN a Task's `completed` property changes, THE Task_Manager SHALL immediately update the strikethrough visual style accordingly.
5. WHEN a Task's `completed` property changes, THE Task_Manager SHALL persist the updated task array to `tld_tasks` in localStorage.

---

### Requirement 7: To-Do List — Delete Task

**User Story:** As a user, I want to delete tasks so that I can remove items I no longer need.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a Delete control for each rendered Task item.
2. WHEN the user activates the Delete control for a Task, THE Task_Manager SHALL remove that Task from the in-memory array.
3. WHEN a Task is deleted, THE Task_Manager SHALL remove the corresponding list item from the UI.
4. WHEN a Task is deleted, THE Task_Manager SHALL persist the updated task array to `tld_tasks` in localStorage.

---

### Requirement 8: Quick Links — Display and Default Presets

**User Story:** As a user, I want to see a panel of shortcut links so that I can quickly navigate to frequently used websites.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Quick_Links_Panel SHALL read the JSON string stored at localStorage key `tld_links` and parse it into a Link array.
2. IF the `tld_links` value is absent, null, or fails JSON parsing, THEN THE Quick_Links_Panel SHALL initialize the Link array with the Default_Links preset and SHALL NOT throw an unhandled exception.
3. THE Default_Links preset SHALL contain at least three Link objects (e.g., Google, GitHub, YouTube).
4. THE Quick_Links_Panel SHALL render each Link as a button or anchor element displaying the Link's `title`.
5. WHEN the user activates a Link button, THE Quick_Links_Panel SHALL open the Link's `url` in a new browser tab.

---

### Requirement 9: Quick Links — Add Link

**User Story:** As a user, I want to add custom shortcut links so that I can access my own frequently used websites.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide input fields for `title` and `url`, and an "Add Link" control.
2. WHEN the user provides a non-empty `title` and a non-empty `url` and activates the Add Link control, THE Quick_Links_Panel SHALL create a new Link object with a unique `id`, the trimmed `title`, and the trimmed `url`.
3. WHEN a new Link is created, THE Quick_Links_Panel SHALL append it to the link array, render it in the UI, and persist the updated array to `tld_links` in localStorage.
4. IF the user activates the Add Link control with an empty `title` or empty `url`, THEN THE Quick_Links_Panel SHALL NOT create a Link and SHALL display a validation error.

---

### Requirement 10: Quick Links — Delete Link

**User Story:** As a user, I want to delete shortcut links so that I can remove ones I no longer need.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a Delete control for each rendered Link.
2. WHEN the user activates the Delete control for a Link, THE Quick_Links_Panel SHALL remove that Link from the in-memory array, remove it from the UI, and persist the updated array to `tld_links` in localStorage.

---

### Requirement 11: Storage Resilience

**User Story:** As a developer, I want the application to handle corrupt or missing localStorage data gracefully so that users are never shown a broken state.

#### Acceptance Criteria

1. WHEN reading `tld_tasks` or `tld_links` from localStorage, THE Dashboard SHALL wrap `JSON.parse` in a `try/catch` block.
2. IF `JSON.parse` throws an exception for `tld_tasks`, THEN THE Task_Manager SHALL initialize with an empty array.
3. IF `JSON.parse` throws an exception for `tld_links`, THEN THE Quick_Links_Panel SHALL initialize with the Default_Links preset.
4. THE Dashboard SHALL handle `localStorage` write failures (e.g., storage quota exceeded) without crashing the application.

---

### Requirement 12: Technical Compatibility and Constraints

**User Story:** As a developer, I want the application to be self-contained and broadly compatible so that it works for all users without setup.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML5, CSS3, and Vanilla JavaScript — no third-party frameworks, libraries, or CDN-hosted resources.
2. THE Dashboard SHALL function correctly when opened via the `file://` protocol or a simple local HTTP server.
3. THE Dashboard SHALL use only system fonts and UTF-8 characters or inline SVG for iconography — no external font or icon CDNs.
4. THE Dashboard SHALL pass functional verification on Chrome, Firefox, Edge, and Safari without polyfills for the specified API usage (localStorage, setInterval, Date).
5. THE Dashboard SHALL consist of exactly three files: `index.html`, `css/style.css`, and `js/app.js`.

---

### Requirement 13: Light / Dark Mode Toggle (Interactive Challenge)

**User Story:** As a user, I want to switch between dark and light color themes so that I can comfortably view the dashboard in different lighting environments.

#### Acceptance Criteria

1. THE Theme_Manager SHALL provide a toggle control accessible on the dashboard interface.
2. WHEN the user activates the theme toggle control, THE Theme_Manager SHALL toggle the visual theme between "dark" and "light" modes.
3. WHEN the theme changes, THE Theme_Manager SHALL update the `data-theme` attribute on the root `<html>` element to trigger corresponding CSS variable styling.
4. WHEN the theme changes, THE Theme_Manager SHALL update the toggle control icon (e.g., "🌙" for dark theme, "☀️" for light theme).
5. THE Theme_Manager SHALL persist the selected theme in localStorage under the key `tld_theme`.
6. WHEN the Dashboard loads, THE Theme_Manager SHALL read the stored theme from `tld_theme` and default to "dark" if the key is absent or invalid.

---

### Requirement 14: Custom Name in Greeting (Interactive Challenge)

**User Story:** As a user, I want to personalize the greeting with my name so that the dashboard feels tailored to me.

#### Acceptance Criteria

1. THE Clock_Widget SHALL display a user name adjacent to the greeting text.
2. WHEN the Dashboard loads, THE Clock_Widget SHALL read the stored name from localStorage key `tld_username`, defaulting to "Guest" if absent or empty.
3. THE Clock_Widget SHALL provide an interactive control (e.g., clickable name or edit button) allowing the user to update their display name.
4. WHEN the user enters a non-empty name string via the input prompt, THE Clock_Widget SHALL update the display name and persist the trimmed string to localStorage under `tld_username`.
5. IF the user cancels the prompt or submits an empty/whitespace-only string, THE Clock_Widget SHALL preserve the fallback default value ("Guest") and update storage accordingly.
