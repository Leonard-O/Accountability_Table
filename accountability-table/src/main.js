import './style.css'

// State Management
const STATE_KEY = 'accountability_data_v1';
let state = {
  days: {} // { "1": "studied", "2": "skipped" }
};
let calendarDate = new Date();
let gridMode = 'full';
let gridMonthDate = new Date();

// Timer State
let timerInterval = null;
let timeLeft = 0;
let isTimerRunning = false;
let currentFocusDay = null;
let isResearchMode = false;

// Initialize App
function init() {
  loadData();
  autoFailSkippedDays();
  setupEventListeners();
  renderGrid();
}

function autoFailSkippedDays() {
  const todayIndex = getDayOfYear(new Date());
  let changed = false;
  for (let i = 1; i < todayIndex; i++) {
    const dayKey = i.toString();
    if (!state.days[dayKey]) {
      state.days[dayKey] = 'skipped';
      changed = true;
    }
  }
  if (changed) saveData();
}

// Data Persistence
function loadData() {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) {
    try { state = JSON.parse(saved); } catch (e) { console.error(e); }
  }
}

function saveData() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('btn-grid').addEventListener('click', () => switchView('grid'));
  document.getElementById('btn-calendar').addEventListener('click', () => switchView('calendar'));

  // Timer Controls
  document.getElementById('btn-start-timer').addEventListener('click', startTimer);
  document.getElementById('btn-cancel-timer').addEventListener('click', closeTimer);

  // Timer Config
  const slider = document.getElementById('duration-slider');
  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    document.getElementById('duration-readout').textContent = val;
    if (!isTimerRunning) {
      document.getElementById('timer-display').textContent = `${val}:00`;
    }
  });

  // Research Toggle
  document.getElementById('research-mode-toggle').addEventListener('change', (e) => {
    toggleResearchMode(e.target.checked);
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function switchView(viewName) {
  document.querySelectorAll('.view-controls button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${viewName}`).classList.add('active');
  const content = document.getElementById('content');
  content.innerHTML = '';
  if (viewName === 'grid') renderGrid(); else renderCalendar();
}

// --- TIMER LOGIC ---

function openTimer(dayIndex) {
  const dayKey = dayIndex.toString();
  console.log(`[DEBUG] openTimer: ${dayIndex}, Status: ${state.days[dayKey]}`);

  if (state.days[dayKey] === 'studied') {
    if (confirm('Unmark this day as studied?')) {
      delete state.days[dayKey];
      saveData();
      refreshCurrentView();
    }
    return;
  }

  console.log('[DEBUG] Proceeding to open modal');

  currentFocusDay = dayIndex;

  // Reset Config
  const slider = document.getElementById('duration-slider');
  slider.value = 25;
  slider.disabled = false;
  document.getElementById('duration-readout').textContent = "25";
  document.getElementById('timer-display').textContent = "25:00";

  // Reset Research Mode
  isResearchMode = false;
  document.getElementById('research-mode-toggle').checked = false;
  toggleResearchMode(false);

  const modal = document.getElementById('timer-modal');
  modal.classList.remove('hidden');
  document.getElementById('timer-status').textContent = "Ready to focus?";
  document.getElementById('timer-status').className = "status-msg";
  document.getElementById('timer-display').classList.remove('paused');
  document.getElementById('btn-start-timer').disabled = false;
  document.getElementById('btn-start-timer').textContent = "Start Focus";
}

function closeTimer() {
  stopTimerInterval();
  document.getElementById('timer-modal').classList.add('hidden');
  currentFocusDay = null;
}

function startTimer() {
  if (isTimerRunning) return;

  const slider = document.getElementById('duration-slider');
  const durationMins = parseInt(slider.value, 10);

  if (durationMins < 15) return alert("Minimum focus time is 15 minutes.");
  if (durationMins > 120) return alert("Maximum focus time is 120 minutes.");

  isTimerRunning = true;
  slider.disabled = true; // Lock input
  document.getElementById('btn-start-timer').disabled = true; // Disable start

  updateTimerStatus();

  timeLeft = durationMins * 60;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

function stopTimerInterval() {
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function completeTimer() {
  stopTimerInterval();
  if (currentFocusDay) {
    const dayKey = currentFocusDay.toString();
    state.days[dayKey] = 'studied';
    saveData();
    refreshCurrentView();
  }
  closeTimer();
  alert("Great job! Session recorded.");
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById('timer-display').textContent = `${mins}:${secs}`;
}

function toggleResearchMode(active) {
  isResearchMode = active;
  const display = document.getElementById('timer-display');
  const status = document.getElementById('timer-status');

  if (active) {
    display.classList.add('researching');
    status.classList.add('researching');
  } else {
    display.classList.remove('researching');
    status.classList.remove('researching');
  }

  if (isTimerRunning) {
    updateTimerStatus();
  }
}

function updateTimerStatus() {
  const status = document.getElementById('timer-status');
  if (isResearchMode) {
    status.textContent = "Research Mode Active. Tab switching allowed.";
  } else {
    status.textContent = "Focus mode ON. Don't leave!";
  }
}

// Anti-Cheat
function handleVisibilityChange() {
  if (!currentFocusDay || document.getElementById('timer-modal').classList.contains('hidden')) return;

  // Bypass if Research Mode is Active
  if (isResearchMode) return;

  if (document.hidden && isTimerRunning) {
    stopTimerInterval();
    document.getElementById('timer-display').classList.add('paused');
    const status = document.getElementById('timer-status');
    status.textContent = "Cheating detected! Timer paused.";
    status.style.color = "hsl(var(--accent-red))";

    document.getElementById('btn-start-timer').disabled = false;
    document.getElementById('btn-start-timer').textContent = "Resume";
  }
}

// --- CORE ---

function toggleDay(dayIndex) {
  const todayIndex = getDayOfYear(new Date());
  if (dayIndex !== todayIndex) return;
  openTimer(dayIndex);
}

function refreshCurrentView() {
  if (document.querySelector('.grid-wrapper')) renderGrid(); else renderCalendar();
}

// Date Helpers
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Grid Navigation
function setGridMode(mode) {
  gridMode = mode;
  renderGrid();
}

function changeGridMonth(delta) {
  gridMonthDate.setMonth(gridMonthDate.getMonth() + delta);
  renderGrid();
}

// Rendering
function renderGrid() {
  const content = document.getElementById('content');
  content.innerHTML = '';

  const todayIndex = getDayOfYear(new Date());
  const todayDate = new Date();

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrapper glass-panel';

  const controls = document.createElement('div');
  controls.className = 'grid-controls';

  const toggleGroup = document.createElement('div');
  toggleGroup.className = 'toggle-group';
  toggleGroup.innerHTML = `
    <button class="${gridMode === 'full' ? 'active-toggle' : ''}" onclick="window.setGridMode('full')">Full Year</button>
    <button class="${gridMode === 'monthly' ? 'active-toggle' : ''}" onclick="window.setGridMode('monthly')">Monthly</button>
  `;
  controls.appendChild(toggleGroup);

  if (gridMode === 'monthly') {
    const navGroup = document.createElement('div');
    navGroup.className = 'nav-group';
    const isJan = gridMonthDate.getMonth() === 0;
    const isDec = gridMonthDate.getMonth() === 11;
    navGroup.innerHTML = `
        <button onclick="window.changeGridMonth(-1)" ${isJan && gridMonthDate.getFullYear() <= todayDate.getFullYear() ? 'disabled' : ''}>&larr;</button>
        <span class="nav-title">${gridMonthDate.toLocaleDateString('en-US', { month: 'long' })}</span>
        <button onclick="window.changeGridMonth(1)" ${isDec && gridMonthDate.getFullYear() >= todayDate.getFullYear() ? 'disabled' : ''}>&rarr;</button>
    `;
    controls.appendChild(navGroup);
  }

  wrapper.appendChild(controls);

  const grid = document.createElement('div');
  grid.className = 'grid-365';

  let startDay = 1;
  let endDay = 365;

  if (gridMode === 'monthly') {
    const year = gridMonthDate.getFullYear();
    const month = gridMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    startDay = getDayOfYear(firstDay);
    endDay = getDayOfYear(lastDay);
    if (startDay < 1) startDay = 1; if (endDay > 365) endDay = 365;
  }

  for (let i = startDay; i <= endDay; i++) {
    const dayKey = i.toString();
    const status = state.days[dayKey];
    let classes = `day-cell`;
    if (status) classes += ` ${status}`;
    if (i === todayIndex) classes += ' current-day'; else classes += ' disabled-day';

    const cell = document.createElement('div');
    cell.className = classes;
    cell.innerHTML = `<span class="day-number">${i}</span>`;
    cell.addEventListener('click', () => toggleDay(i));
    grid.appendChild(cell);
  }

  wrapper.appendChild(grid);
  content.appendChild(wrapper);
}

function renderCalendar() {
  const content = document.getElementById('content');
  content.innerHTML = '';

  const todayIndex = getDayOfYear(new Date());

  const wrapper = document.createElement('div');
  wrapper.className = 'calendar-wrapper glass-panel';

  const header = document.createElement('div');
  header.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '&larr;';
  prevBtn.onclick = () => changeMonth(-1);

  const title = document.createElement('h2');
  title.textContent = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  title.className = 'calendar-title';

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '&rarr;';
  nextBtn.onclick = () => changeMonth(1);

  header.append(prevBtn, title, nextBtn);
  wrapper.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdays.forEach(d => {
    const el = document.createElement('div');
    el.className = 'weekday-label';
    el.textContent = d;
    grid.appendChild(el);
  });

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayDate = new Date(year, month, d);
    const dayIndex = getDayOfYear(currentDayDate);
    const dayKey = dayIndex.toString();
    const status = state.days[dayKey];

    const cell = document.createElement('div');
    let classes = `calendar-day day-cell`;
    if (status) classes += ` ${status}`;
    if (dayIndex === todayIndex) classes += ' current-day'; else classes += ' disabled-day';
    if (dayIndex > 365 || dayIndex <= 0) classes += ' disabled-day';

    cell.className = classes;
    cell.textContent = d;
    cell.addEventListener('click', () => toggleDay(dayIndex));
    grid.appendChild(cell);
  }

  wrapper.appendChild(grid);
  content.appendChild(wrapper);
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderCalendar();
}


window.setGridMode = setGridMode;
window.changeGridMonth = changeGridMonth;
window.toggleDay = toggleDay;
window.openTimer = openTimer;
window.getDayOfYear = getDayOfYear;
window.getDayOfYear = getDayOfYear;

init();
