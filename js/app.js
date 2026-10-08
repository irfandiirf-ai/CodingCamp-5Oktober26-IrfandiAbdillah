"use strict";

/* ================================================================
   CONSTANTS & LOCAL STORAGE KEYS
   ================================================================ */
const LS_TASKS = "tld_tasks";
const LS_LINKS = "tld_links";
const LS_NAME  = "tld_username";
const LS_THEME = "tld_theme";

const TIMER_DURATION = 25 * 60;

const DEFAULT_LINKS = [
  { id: "dl-1", title: "Google",   url: "https://www.google.com"   },
  { id: "dl-2", title: "GitHub",   url: "https://github.com"       },
  { id: "dl-3", title: "YouTube",  url: "https://www.youtube.com"  },
  { id: "dl-4", title: "MDN Docs", url: "https://developer.mozilla.org" },
];

/* ================================================================
   UTILITIES
   ================================================================ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently catch quota limit
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* ================================================================
   CHALLENGE 1: LIGHT / DARK THEME
   ================================================================ */
(function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem(LS_THEME) || "dark";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    toggleBtn.textContent = theme === "light" ? "☀️" : "🌙";
    localStorage.setItem(LS_THEME, theme);
  }

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  applyTheme(savedTheme);
})();

/* ================================================================
   MODULE: CLOCK & CHALLENGE 2: CUSTOM NAME GREETING
   ================================================================ */
(function initClock() {
  const elGreeting = document.getElementById("greeting");
  const elClock    = document.getElementById("clock");
  const elDate     = document.getElementById("date-display");
  const elUserName = document.getElementById("user-name");
  const btnEdit    = document.getElementById("btn-edit-name");

  // Load username
  let currentName = localStorage.getItem(LS_NAME) || "Guest";
  elUserName.textContent = currentName;

  function changeName() {
    const newName = prompt("Enter your name:", currentName);
    if (newName !== null) {
      const trimmed = newName.trim();
      currentName = trimmed || "Guest";
      elUserName.textContent = currentName;
      localStorage.setItem(LS_NAME, currentName);
    }
  }

  elUserName.addEventListener("click", changeName);
  btnEdit.addEventListener("click", changeName);

  function getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night";
  }

  function tick() {
    const now = new Date();
    const h   = now.getHours();
    const m   = now.getMinutes();
    const s   = now.getSeconds();

    elClock.textContent = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    elDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    elGreeting.textContent = getGreeting(h);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ================================================================
   MODULE: FOCUS TIMER
   ================================================================ */
(function initTimer() {
  const elDisplay = document.getElementById("timer-display");
  const btnStart  = document.getElementById("btn-start");
  const btnPause  = document.getElementById("btn-pause");
  const btnStop   = document.getElementById("btn-stop");
  const btnReset  = document.getElementById("btn-reset");

  let remaining  = TIMER_DURATION;
  let intervalId = null;
  let running    = false;

  function render() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    elDisplay.textContent = `${pad2(mins)}:${pad2(secs)}`;
  }

  function setRunningState(isRunning) {
    running = isRunning;
    btnStart.disabled = isRunning;
    btnPause.disabled = !isRunning;
    btnStop.disabled  = !isRunning;

    if (isRunning) elDisplay.classList.add("running");
    else elDisplay.classList.remove("running");

    render();
  }

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start() {
    if (running) return;
    if (remaining === 0) remaining = TIMER_DURATION;

    setRunningState(true);
    intervalId = setInterval(() => {
      remaining -= 1;
      render();

      if (remaining <= 0) {
        remaining = 0;
        clearTimer();
        setRunningState(false);
        render();
        setTimeout(() => alert("⏰ Focus session complete! Take a break."), 50);
      }
    }, 1000);
  }

  function pause() {
    if (!running) return;
    clearTimer();
    setRunningState(false);
  }

  function stop() {
    clearTimer();
    remaining = TIMER_DURATION;
    setRunningState(false);
    render();
  }

  btnStart.addEventListener("click", start);
  btnPause.addEventListener("click", pause);
  btnStop.addEventListener("click", stop);
  btnReset.addEventListener("click", stop);

  render();
  setRunningState(false);
})();

/* ================================================================
   MODULE: TO-DO LIST & CHALLENGE 3: PREVENT DUPLICATE TASKS
   ================================================================ */
(function initTodoList() {
  const elList      = document.getElementById("task-list");
  const elInput     = document.getElementById("task-input");
  const btnAdd      = document.getElementById("btn-add-task");
  const elError     = document.getElementById("task-error");

  const elModal     = document.getElementById("edit-modal");
  const elEditInput = document.getElementById("edit-task-input");
  const elEditError = document.getElementById("edit-error");
  const btnSaveEdit = document.getElementById("btn-save-edit");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");

  let tasks = lsGet(LS_TASKS, []);
  if (!Array.isArray(tasks)) tasks = [];
  let editingId = null;

  function saveTasks() {
    lsSet(LS_TASKS, tasks);
  }

  function showError(el, input, msg) {
    el.textContent = msg;
    el.hidden = false;
    if (input) input.classList.add("input-error");
  }

  function clearError(el, input) {
    el.hidden = true;
    if (input) input.classList.remove("input-error");
  }

  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "task-text" + (task.completed ? " completed" : "");
    span.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-ghost";
    btnEdit.textContent = "✏️";
    btnEdit.style.padding = "4px 8px";
    btnEdit.addEventListener("click", () => openEditModal(task.id));

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-danger";
    btnDel.textContent = "🗑";
    btnDel.addEventListener("click", () => deleteTask(task.id));

    actions.append(btnEdit, btnDel);
    li.append(checkbox, span, actions);
    return li;
  }

  function renderTasks() {
    elList.innerHTML = "";
    tasks.forEach(task => elList.appendChild(createTaskElement(task)));
  }

  /* ── Add Task with Duplicate Prevention ── */
  function addTask() {
    const text = elInput.value.trim();
    if (!text) {
      showError(elError, elInput, "Task cannot be empty.");
      elInput.focus();
      return;
    }

    // CEK DUPLIKAT (case-insensitive)
    const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
      showError(elError, elInput, "This task already exists.");
      elInput.focus();
      return;
    }

    clearError(elError, elInput);

    const newTask = {
      id: uid(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    saveTasks();
    elList.appendChild(createTaskElement(newTask));
    elInput.value = "";
    elInput.focus();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();

    const li = elList.querySelector(`[data-id="${id}"]`);
    const spanEl = li && li.querySelector(".task-text");
    if (spanEl) {
      spanEl.classList.toggle("completed", task.completed);
    }
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingId = id;
    elEditInput.value = task.text;
    clearError(elEditError, elEditInput);
    elModal.hidden = false;
    elEditInput.focus();
  }

  function closeEditModal() {
    elModal.hidden = true;
    editingId = null;
    clearError(elEditError, elEditInput);
  }

  function saveEdit() {
    const text = elEditInput.value.trim();
    if (!text) {
      showError(elEditError, elEditInput, "Task cannot be empty.");
      return;
    }

    // CEK DUPLIKAT SAAT EDIT (abaikan task itu sendiri)
    const isDuplicate = tasks.some(t => t.id !== editingId && t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
      showError(elEditError, elEditInput, "Another task already has this name.");
      return;
    }

    const task = tasks.find(t => t.id === editingId);
    if (!task) { closeEditModal(); return; }

    task.text = text;
    saveTasks();

    const li = elList.querySelector(`[data-id="${editingId}"]`);
    const spanEl = li && li.querySelector(".task-text");
    if (spanEl) spanEl.textContent = text;

    closeEditModal();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    const li = elList.querySelector(`[data-id="${id}"]`);
    if (li) li.remove();
  }

  btnAdd.addEventListener("click", addTask);
  elInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
  elInput.addEventListener("input", () => {
    if (elInput.value.trim()) clearError(elError, elInput);
  });

  btnSaveEdit.addEventListener("click", saveEdit);
  btnCancelEdit.addEventListener("click", closeEditModal);
  elEditInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") closeEditModal();
  });

  renderTasks();
})();

/* ================================================================
   MODULE: QUICK LINKS
   ================================================================ */
(function initQuickLinks() {
  const elGrid    = document.getElementById("links-grid");
  const elTitleIn = document.getElementById("link-title-input");
  const elUrlIn   = document.getElementById("link-url-input");
  const btnAdd    = document.getElementById("btn-add-link");
  const elError   = document.getElementById("link-error");

  let links = lsGet(LS_LINKS, null);
  if (!Array.isArray(links)) {
    links = DEFAULT_LINKS.map(l => ({ ...l }));
    lsSet(LS_LINKS, links);
  }

  function saveLinks() {
    lsSet(LS_LINKS, links);
  }

  function createLinkElement(link) {
    const wrapper = document.createElement("div");
    wrapper.className = "link-item";
    wrapper.dataset.id = link.id;

    const anchor = document.createElement("a");
    anchor.className = "link-btn";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.title;

    const delBtn = document.createElement("button");
    delBtn.className = "link-delete-btn";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => deleteLink(link.id));

    wrapper.append(anchor, delBtn);
    return wrapper;
  }

  function renderLinks() {
    elGrid.innerHTML = "";
    links.forEach(link => elGrid.appendChild(createLinkElement(link)));
  }

  function addLink() {
    const title = elTitleIn.value.trim();
    let url = elUrlIn.value.trim();

    if (!title || !url) {
      elError.textContent = "Title and URL are required.";
      elError.hidden = false;
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    elError.hidden = true;
    const newLink = { id: uid(), title, url };
    links.push(newLink);
    saveLinks();
    elGrid.appendChild(createLinkElement(newLink));

    elTitleIn.value = "";
    elUrlIn.value = "";
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    const el = elGrid.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
  }

  btnAdd.addEventListener("click", addLink);
  renderLinks();
})();