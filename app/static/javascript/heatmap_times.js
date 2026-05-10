const ALL_DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// Parse active days from template-injected EVENT_DAYS (e.g. "0,2,4")
const ACTIVE_DAYS = EVENT_DAYS.split(',').map(Number).filter(n => n >= 0 && n <= 6);
const DAY_NAMES   = ACTIVE_DAYS.map(i => ALL_DAY_NAMES[i]);

// Parse time range from template-injected EVENT_TIME_FROM / EVENT_TIME_TO
function parseHour(timeStr) { return parseInt(timeStr.split(':')[0], 10); }
function parseMinute(timeStr) { return parseInt(timeStr.split(':')[1], 10); }

const START_HOUR   = parseHour(EVENT_TIME_FROM);
const START_MINUTE = parseMinute(EVENT_TIME_FROM);
const END_HOUR     = parseHour(EVENT_TIME_TO);
const END_MINUTE   = parseMinute(EVENT_TIME_TO);

const SLOTS_PER_HOUR = 4; // 15-min slots
const START_SLOT  = START_HOUR * SLOTS_PER_HOUR + Math.floor(START_MINUTE / 15);
const END_SLOT    = END_HOUR   * SLOTS_PER_HOUR + Math.floor(END_MINUTE   / 15);
const TOTAL_SLOTS = END_SLOT - START_SLOT;

const groupData  = {};
const myData     = {};
const peopleData = {}; // key -> string[]

async function loadAvailability() {
  if (!EVENT_ID) return;
  const res  = await fetch(`/event/${EVENT_ID}/availability`);
  const data = await res.json();
  for (const key of data.my_slots)                        myData[key]    = true;
  for (const [k, v] of Object.entries(data.group_data))  groupData[k]   = Math.min(v, 5);
  for (const [k, v] of Object.entries(data.people_data)) peopleData[k]  = v;
  render();
  updatePopular();
}

async function saveAvailability() {
  if (!EVENT_ID) return;
  await fetch(`/event/${EVENT_ID}/availability`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
    body:    JSON.stringify({ slots: Object.keys(myData) })
  });
}

// key: "dayIndex-absoluteSlot" — dayIndex is original 0-6, slot is absolute (not relative)
function slotKey(day, slot) {
  return `${day}-${START_SLOT + slot}`;
}

function slotToTime(slot) {
  const totalMins = (START_SLOT + slot) * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return { h, m };
}

function slotLabel(slot) {
  const { h, m } = slotToTime(slot);
  if (m !== 0) return '';
  const suffix = h < 12 ? 'am' : 'pm';
  const hour   = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${hour}:00 ${suffix}`;
}


// Drag state
let isDragging = false;
let dragMode   = 'add'; // 'add' or 'remove'

const myPrev = {};

function applyCell(el) {
  const k = el.dataset.key;
  if (!k) return;

  if (dragMode === 'add') {
    if (myData[k]) {
      // deselect — restore to exactly what it was before
      groupData[k]   = myPrev[k] ?? Math.max(0, (groupData[k] || 0) - 1);
      delete myData[k];
      delete myPrev[k];
      peopleData[k]  = (peopleData[k] || []).filter(n => n !== 'You');
    } else {
      myPrev[k]      = groupData[k] || 0;
      myData[k]      = true;
      groupData[k]   = Math.min(5, (groupData[k] || 0) + 1);
      peopleData[k]  = ['You', ...(peopleData[k] || [])];
    }
  } else {
    if (!myData[k]) return;
    groupData[k]   = myPrev[k] ?? Math.max(0, (groupData[k] || 0) - 1);
    delete myData[k];
    delete myPrev[k];
    peopleData[k]  = (peopleData[k] || []).filter(n => n !== 'You');
  }

  el.className = cellClass(k);
  updatePopular();
}

function cellClass(k) {
  const level = groupData[k] || 0;
  return ['cell', `heat-${level}`, myData[k] ? 'mine' : ''].filter(Boolean).join(' ');
}

function setMode(mode) {
  dragMode = mode;
  document.getElementById('btn-add').classList.toggle('active', mode === 'add');
  document.getElementById('btn-remove').classList.toggle('active', mode === 'remove');
}

function render() {
  const container = document.getElementById('grid');
  if (!container) return;

  // Set grid columns: 1 time-label + N day columns
  container.style.gridTemplateColumns = `60px repeat(${ACTIVE_DAYS.length}, 1fr)`;

  let html = '';

  // Corner spacer + day headers (only active days)
  html += `<div class="corner"></div>`;
  DAY_NAMES.forEach(d => { html += `<div class="day-header">${d}</div>`; });

  // Rows: one per slot within the time range
  for (let s = 0; s < TOTAL_SLOTS; s++) {
    html += `<div class="time-label">${slotLabel(s)}</div>`;
    ACTIVE_DAYS.forEach(d => {
      const k = slotKey(d, s);
      html += `<div class="${cellClass(k)}" data-key="${k}"></div>`;
    });
  }

  container.innerHTML = html;
}

function initListeners() {
  const container = document.getElementById('grid');
  if (!container) return;

  // Prevent text selection while dragging
  container.addEventListener('mousedown', e => e.preventDefault());

  container.addEventListener('mousedown', e => {
    if (!e.target.dataset.key) return;
    isDragging = true;
    applyCell(e.target);
  });

  container.addEventListener('mouseover', e => {
    if (isDragging && e.target.dataset.key) applyCell(e.target);
    if (e.target.dataset.key) showPanel(e.target.dataset.key);
  });

  container.addEventListener('mouseleave', clearPanel);
}

function slotFullLabel(absoluteSlot) {
  const totalMins = absoluteSlot * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const hour   = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
}

function showPanel(key) {
  const panel   = document.getElementById('hover-panel');
  const titleEl = document.getElementById('panel-title');
  const listEl  = document.getElementById('panel-list');
  const [d, s]  = key.split('-').map(Number);
  const people  = peopleData[key] || [];
  const label   = `${ALL_DAY_NAMES[d]}, ${slotFullLabel(s)}`;

  titleEl.textContent = label;
  listEl.innerHTML = people.length
    ? people.map(n => `<li class="${n === 'You' ? 'panel-you' : ''}">${n}</li>`).join('')
    : `<li class="panel-empty">no responses yet</li>`;
  panel.classList.add('visible');
}

function clearPanel() {
  document.getElementById('hover-panel').classList.remove('visible');
}

const SHARE_CODE = Math.random().toString(36).slice(2, 8).toUpperCase();

function initShareCode() {
  const el = document.getElementById('share-code');
  if (el) el.textContent = SHARE_CODE;
}

function copyCode() {
  navigator.clipboard.writeText(SHARE_CODE).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'copied!';
    setTimeout(() => { btn.textContent = 'copy'; }, 1500);
  });
}

function updatePopular() {
  let bestKey = null, bestCount = 0;
  for (const [k, count] of Object.entries(groupData)) {
    if (count > bestCount) { bestCount = count; bestKey = k; }
  }
  const valueEl = document.getElementById('popular-value');
  const countEl = document.getElementById('popular-count');
  if (!bestKey || bestCount === 0) {
    valueEl.textContent = '—';
    countEl.textContent = '';
    return;
  }
  const [d, s] = bestKey.split('-').map(Number);
  valueEl.textContent = `${ALL_DAY_NAMES[d]}, ${slotFullLabel(s)}`;
  countEl.textContent = `${bestCount} ${bestCount === 1 ? 'person' : 'people'}`;
}

document.addEventListener('mouseup', () => {
  if (isDragging) saveAvailability();
  isDragging = false;
});

document.addEventListener('DOMContentLoaded', () => {
  render();
  initListeners();
  updatePopular();
  initShareCode();
  if (EVENT_ID) loadAvailability();
});