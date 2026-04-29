const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const START_HOUR  = 9;   // 9am
const END_HOUR    = 17;  // 5pm
const SLOTS_PER_HOUR = 4; // 15-min slots
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

const groupData  = {};
const myData     = {};
const peopleData = {}; // key -> string[]

const FAKE_NAMES = ['Alice','Ben','Clara','Diego','Eva','Felix','Grace','Hugo','Isla','Jake'];

// key format: "dayIndex-slotIndex"  e.g. "0-0" = Mon 9:00am
function slotKey(day, slot) {
  return `${day}-${slot}`;
}

function slotLabel(slot) {
  const h = START_HOUR + Math.floor(slot / SLOTS_PER_HOUR);
  const m = (slot % SLOTS_PER_HOUR) * 15;
  const suffix = h < 12 ? 'am' : 'pm';
  const hour   = h <= 12 ? h : h - 12;
  return m === 0 ? `${hour}:00 ${suffix}` : '';
}

function seedGroupData() {
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < TOTAL_SLOTS; s++) {
      const k = slotKey(d, s);
      if (groupData[k] === undefined) {
        const count = (d >= 1 && d <= 3 && s >= 4 && s <= 24)
          ? Math.floor(Math.random() * 4) + 1
          : (Math.random() < 0.25 ? Math.floor(Math.random() * 2) : 0);
        groupData[k]  = count;
        peopleData[k] = FAKE_NAMES.slice().sort(() => 0.5 - Math.random()).slice(0, count);
      }
    }
  }
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

  let html = '';

  // Corner spacer + day headers
  html += `<div class="corner"></div>`;
  DAY_NAMES.forEach(d => { html += `<div class="day-header">${d}</div>`; });

  // Rows: one per slot
  for (let s = 0; s < TOTAL_SLOTS; s++) {
    html += `<div class="time-label">${slotLabel(s)}</div>`;
    for (let d = 0; d < 7; d++) {
      const k = slotKey(d, s);
      html += `<div class="${cellClass(k)}" data-key="${k}"></div>`;
    }
  }

  container.innerHTML = html;

  // Attach drag listeners to the grid (event delegation)
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

  // Prevent text selection while dragging
  container.addEventListener('mousedown', e => e.preventDefault());
}

function slotFullLabel(slot) {
  const h = START_HOUR + Math.floor(slot / SLOTS_PER_HOUR);
  const m = (slot % SLOTS_PER_HOUR) * 15;
  const suffix = h < 12 ? 'am' : 'pm';
  const hour   = h <= 12 ? h : h - 12;
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
}

function showPanel(key) {
  const panel   = document.getElementById('hover-panel');
  const titleEl = document.getElementById('panel-title');
  const listEl  = document.getElementById('panel-list');
  const [d, s]  = key.split('-').map(Number);
  const people  = peopleData[key] || [];
  const label   = `${DAY_NAMES[d]}, ${slotFullLabel(s)}`;

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
  valueEl.textContent = `${DAY_NAMES[d]}, ${slotFullLabel(s)}`;
  countEl.textContent = `${bestCount} ${bestCount === 1 ? 'person' : 'people'}`;
}

document.addEventListener('mouseup', () => { isDragging = false; });

document.addEventListener('DOMContentLoaded', () => {
  seedGroupData();
  render();
  updatePopular();
  initShareCode();
});