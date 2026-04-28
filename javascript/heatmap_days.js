const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const today = new Date();
const later = new Date(today);
later.setDate(later.getDate() + 30);

let range = {
  from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  to:   new Date(later.getFullYear(), later.getMonth(), later.getDate())
};

let viewYear  = today.getFullYear();
let viewMonth = today.getMonth();

const groupData  = {};
const myData     = {};
const peopleData = {}; // key -> string[]

// Fake participant names for demo
const FAKE_NAMES = ['Alice','Ben','Clara','Diego','Eva','Felix','Grace','Hugo','Isla','Jake'];

// For demo: seed some random data for the whole range
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

function seedGroupData() {
  const cur = new Date(range.from);
  while (cur <= range.to) {
    const k   = fmtDate(cur);
    const dow = cur.getDay();
    const mid     = cur.getDate() >= 8 && cur.getDate() <= 22;
    const weekend = dow === 0 || dow === 6;
    if (groupData[k] === undefined) {
      let count;
      if (!weekend && mid)  count = Math.floor(Math.random() * 3) + 2;
      else if (!weekend)    count = Math.floor(Math.random() * 2) + 1;
      else                  count = Math.random() < 0.3 ? 1 : 0;
      groupData[k]  = count;
      peopleData[k] = FAKE_NAMES.slice().sort(() => 0.5 - Math.random()).slice(0, count);
    }
    cur.setDate(cur.getDate() + 1);
  }
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
  } else {
    myData[k]    = true;
    groupData[k] = Math.min(5, (groupData[k] || 0) + 1);
    peopleData[k] = ['You', ...(peopleData[k] || [])];
  }

  render();
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
    const level   = groupData[k] || 0;
    const classes = [
      'day',
      `heat-${level}`,
      inRange       ? 'in-range'     : 'out-of-range',
      myData[k]     ? 'mine'         : '',
      k === todayKey ? 'today'       : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" data-key="${k}" data-inrange="${inRange}" onclick="toggleDay(this)">${d}</div>`;
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

// 
document.addEventListener('DOMContentLoaded', () => {
  seedGroupData();
  render();
});