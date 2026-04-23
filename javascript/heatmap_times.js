const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const START_HOUR  = 9;   // 9am
const END_HOUR    = 17;  // 5pm
const SLOTS_PER_HOUR = 4; // 15-min slots
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

// groupData[key] = 0–5 (how many people are free at this slot)
// myData[key]    = true if the current user marked this slot
const groupData = {};
const myData    = {};

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

// Seed fake group availability
function seedGroupData() {
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < TOTAL_SLOTS; s++) {
      const k = slotKey(d, s);
      if (groupData[k] === undefined) {
        // Tue–Thu midday slightly busier
        groupData[k] = (d >= 1 && d <= 3 && s >= 4 && s <= 24)
          ? Math.floor(Math.random() * 4) + 1
          : (Math.random() < 0.25 ? Math.floor(Math.random() * 2) : 0);
      }
    }
  }
}

// Drag state
let isDragging = false;
let dragMode   = 'add'; // 'add' or 'remove'

function applyCell(el) {
  const k = el.dataset.key;
  if (!k) return;

  if (dragMode === 'add') {
    if (myData[k]) return;
    myData[k]    = true;
    groupData[k] = Math.min(5, (groupData[k] || 0) < 2 ? 3 : (groupData[k] || 0));
  } else {
    if (!myData[k]) return;
    delete myData[k];
    groupData[k] = Math.max(0, (groupData[k] || 0) - 1);
  }

  // Update just this cell's class instead of full re-render
  el.className = cellClass(k);
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
  });

  // Prevent text selection while dragging
  container.addEventListener('mousedown', e => e.preventDefault());
}

document.addEventListener('mouseup', () => { isDragging = false; });

document.addEventListener('DOMContentLoaded', () => {
  seedGroupData();
  render();
});