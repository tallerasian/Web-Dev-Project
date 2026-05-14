const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const today = new Date();

function parseDateLocal(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const rangeFrom = EVENT_DATE_FROM ? parseDateLocal(EVENT_DATE_FROM) : today;
const rangeTo   = EVENT_DATE_TO   ? parseDateLocal(EVENT_DATE_TO)   : (() => {
  const d = new Date(today); d.setDate(d.getDate() + 30); return d;
})();

let range = { from: rangeFrom, to: rangeTo };

let viewYear  = range.from.getFullYear();
let viewMonth = range.from.getMonth();

const groupData  = {};
const myData     = {};
const peopleData = {}; // key -> string[]

let participantCount   = 0;
let userIsParticipant  = false;

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
  const t      = Math.min(count / total, 1) * (HEAT_STOPS.length - 1);
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
  participantCount  = data.participant_count || 0;
  userIsParticipant = data.my_slots.length > 0;
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

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function fmtDate(date) {
  return date.toISOString().split('T')[0];
}

function isInRange(y, m, d) {
  const dt = new Date(y, m, d);
  return dt >= range.from && dt <= range.to;
}


function changeMonth(dir) {
  viewMonth += dir;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  render();
}

// Toggle entire day when header clicked
function toggleDay(el) {
  const k = el.dataset.key;
  if (el.dataset.inrange !== 'true') return;

  if (myData[k]) {
    delete myData[k];
    groupData[k] = Math.max(0, (groupData[k] || 0) - 1);
    peopleData[k] = (peopleData[k] || []).filter(n => n !== 'You');
    if (userIsParticipant && Object.keys(myData).length === 0) {
      participantCount--;
      userIsParticipant = false;
    }
  } else {
    myData[k]    = true;
    groupData[k] = (groupData[k] || 0) + 1;
    peopleData[k] = ['You', ...(peopleData[k] || [])];
    if (!userIsParticipant) {
      participantCount++;
      userIsParticipant = true;
    }
  }

  render();
  updatePopular();
  saveAvailability();
}

function render() {
  const container = document.getElementById('calendar');
  if (!container) return;

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey   = fmtDate(new Date());

  let html = '';

  html += `<div class="month-nav">
    <button onclick="changeMonth(-1)">&#8249;</button>
    <span>${MONTH_NAMES[viewMonth]} ${viewYear}</span>
    <button onclick="changeMonth(1)">&#8250;</button>
  </div>`;

  html += `<div class="day-grid">`;

  DAY_NAMES.forEach(d => { html += `<div class="dow">${d}</div>`; });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const k       = dateKey(viewYear, viewMonth, d);
    const inRange = isInRange(viewYear, viewMonth, d);
    const count   = groupData[k] || 0;
    const bg      = heatColor(count, participantCount);
    const textColor = participantCount && count / participantCount > 0.5 ? 'white' : '';
    const classes = [
      'day',
      inRange       ? 'in-range'     : 'out-of-range',
      myData[k]     ? 'mine'         : '',
      k === todayKey ? 'today'       : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" style="background:${bg};color:${textColor}" data-key="${k}" data-inrange="${inRange}" onclick="toggleDay(this)">${d}</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;

  // Hover: update sidebar panel
  container.querySelectorAll('.day:not(.empty):not(.out-of-range)').forEach(el => {
    el.addEventListener('mouseenter', () => showPanel(el.dataset.key));
    el.addEventListener('mouseleave', clearPanel);
  });
}

function showPanel(key) {
  const panel      = document.getElementById('hover-panel');
  const titleEl    = document.getElementById('panel-title');
  const listEl     = document.getElementById('panel-list');
  const people     = peopleData[key] || [];
  const [y, m, d]  = key.split('-');
  const date       = new Date(+y, +m - 1, +d);
  const label      = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  titleEl.textContent = label;
  listEl.innerHTML = people.length
    ? people.map(n => `<li class="${n === 'You' ? 'panel-you' : ''}">${n}</li>`).join('')
    : `<li class="panel-empty">no responses yet</li>`;
  panel.classList.add('visible');
}

function clearPanel() {
  document.getElementById('hover-panel').classList.remove('visible');
}

// Generate a random 6-char share code once and set it immediately
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

  // all days tied at the max, sorted chronologically
  const topDays = entries
    .filter(([, v]) => v === maxCount)
    .map(([k]) => k)
    .sort();

  // split into runs of consecutive calendar days
  const streaks = [];
  let streak = [topDays[0]];
  for (let i = 1; i < topDays.length; i++) {
    const [y, m, d] = topDays[i - 1].split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    if (nextKey === topDays[i]) {
      streak.push(topDays[i]);
    } else {
      streaks.push(streak);
      streak = [topDays[i]];
    }
  }
  streaks.push(streak);

  // pick the longest streak; tie goes to the first
  const best = streaks.reduce((a, b) => b.length > a.length ? b : a);

  const fmtKey = key => {
    const [y, m, d] = key.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  valueEl.textContent = best.length === 1
    ? fmtKey(best[0])
    : `${fmtKey(best[0])} → ${fmtKey(best[best.length - 1])}`;
  countEl.textContent = `${maxCount} ${maxCount === 1 ? 'person' : 'people'}`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (EVENT_ID) {
    loadAvailability();
  } else {
    render();
    updatePopular();
  }
  initShareCode();
});