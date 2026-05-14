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

let participantCount    = 0;
let userIsParticipant  = false;
let myView             = false;

const HEAT_STOPS = [
  [250, 240, 220], // #FAF0DC — 0 people
  [245, 216, 138], // #F5D88A
  [240, 188,  69], // #F0BC45
  [224, 144,  32], // #E09020
  [192,  96,  16], // #C06010
  [154,  58,   0], // #9A3A00 — all people
];

function heatColor(count, total) {
  if (!count || !total) return '#FAF0DC';
  const t      = (count / (total + 4)) * (HEAT_STOPS.length - 1);
  const lo     = Math.floor(t);
  const hi     = Math.min(lo + 1, HEAT_STOPS.length - 1);
  const frac   = t - lo;
  const [r1, g1, b1] = HEAT_STOPS[lo];
  const [r2, g2, b2] = HEAT_STOPS[hi];
  return `rgb(${Math.round(r1+(r2-r1)*frac)},${Math.round(g1+(g2-g1)*frac)},${Math.round(b1+(b2-b1)*frac)})`;
}

async function loadAvailability() {
  if (!EVENT_ID) return;
  const res  = await fetch(`/event/${EVENT_ID}/availability`);
  const data = await res.json();
  participantCount   = data.participant_count || 0;
  userIsParticipant  = data.my_slots.length > 0;
  if (!userIsParticipant) {
    participantCount++;   // pre-count this user so first click doesn't rescale all colours
    userIsParticipant = true;
  }
  for (const key of data.my_slots)                        myData[key]    = true;
  for (const [k, v] of Object.entries(data.group_data))  groupData[k]   = v;
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

  const prevParticipantCount = participantCount;

  if (dragMode === 'add') {
    if (myData[k]) {
      // deselect — restore to exactly what it was before
      groupData[k]   = myPrev[k] ?? Math.max(0, (groupData[k] || 0) - 1);
      delete myData[k];
      delete myPrev[k];
      peopleData[k]  = (peopleData[k] || []).filter(n => n !== 'You');
      if (userIsParticipant && Object.keys(myData).length === 0) {
        participantCount--;
        userIsParticipant = false;
      }
    } else {
      myPrev[k]      = groupData[k] || 0;
      myData[k]      = true;
      groupData[k]   = (groupData[k] || 0) + 1;
      peopleData[k]  = ['You', ...(peopleData[k] || [])];
      if (!userIsParticipant) {
        participantCount++;
        userIsParticipant = true;
      }
    }
  } else {
    if (!myData[k]) return;
    groupData[k]   = myPrev[k] ?? Math.max(0, (groupData[k] || 0) - 1);
    delete myData[k];
    delete myPrev[k];
    peopleData[k]  = (peopleData[k] || []).filter(n => n !== 'You');
    if (userIsParticipant && Object.keys(myData).length === 0) {
      participantCount--;
      userIsParticipant = false;
    }
  }

  if (participantCount !== prevParticipantCount) {
    render(); // all cell ratios shift — full re-render
  } else {
    const bg = myView
      ? (myData[k] ? '#F0BC45' : '#FAF0DC')
      : heatColor(groupData[k] || 0, participantCount);
    el.className = `cell${myData[k] ? ' mine' : ''}`;
    el.style.background = bg;
  }
  updatePopular();
}

function clearAll() {
  const keys = Object.keys(myData);
  if (!keys.length) return;

  for (const k of keys) {
    groupData[k]  = myPrev[k] ?? Math.max(0, (groupData[k] || 0) - 1);
    delete myPrev[k];
    peopleData[k] = (peopleData[k] || []).filter(n => n !== 'You');
    delete myData[k];
  }

  if (userIsParticipant) {
    participantCount--;
    userIsParticipant = false;
  }

  render();
  updatePopular();
  saveAvailability();
}

function toggleMyPicks() {
  myView = !myView;
  document.getElementById('btn-my-picks').classList.toggle('active', myView);
  render();
}

function cellClass(k) {
  const bg = myView
    ? (myData[k] ? '#F0BC45' : '#FAF0DC')
    : heatColor(groupData[k] || 0, participantCount);
  return { cls: `cell${myData[k] ? ' mine' : ''}`, bg };
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
      const { cls, bg } = cellClass(k);
      html += `<div class="${cls}" style="background:${bg}" data-key="${k}"></div>`;
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
  const valueEl = document.getElementById('popular-value');
  const countEl = document.getElementById('popular-count');

  const entries = Object.entries(groupData).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    valueEl.textContent = '—';
    countEl.textContent = '';
    return;
  }

  const maxCount = Math.max(...entries.map(([, v]) => v));

  // group top slots by day
  const byDay = {};
  for (const [k] of entries.filter(([, v]) => v === maxCount)) {
    const [d, s] = k.split('-').map(Number);
    (byDay[d] = byDay[d] || []).push(s);
  }

  // find all consecutive runs within each day
  const streaks = [];
  for (const [day, slots] of Object.entries(byDay)) {
    const d = Number(day);
    slots.sort((a, b) => a - b);
    let run = [slots[0]];
    for (let i = 1; i < slots.length; i++) {
      if (slots[i] === slots[i - 1] + 1) {
        run.push(slots[i]);
      } else {
        streaks.push({ day: d, slots: run });
        run = [slots[i]];
      }
    }
    streaks.push({ day: d, slots: run });
  }

  // pick longest streak; tie goes to first found
  const best = streaks.reduce((a, b) => b.slots.length > a.slots.length ? b : a);

  if (best.slots.length === 1) {
    valueEl.textContent = `${ALL_DAY_NAMES[best.day]}, ${slotFullLabel(best.slots[0])}`;
  } else {
    const start = slotFullLabel(best.slots[0]);
    const end   = slotFullLabel(best.slots[best.slots.length - 1] + 1);
    valueEl.textContent = `${ALL_DAY_NAMES[best.day]}, ${start} → ${end}`;
  }
  countEl.textContent = `${maxCount} ${maxCount === 1 ? 'person' : 'people'}`;
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