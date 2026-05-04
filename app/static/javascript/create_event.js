const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

let currentType = null; 

// Mini calendar state
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

// Selected date range (for Specific Days mode)
let rangeFrom = null;
let rangeTo   = null;
let pickingEnd = false;

// Selected week days (for Days of Week mode)
const selectedDays = new Set();

// ── TYPE SWITCHING ──────────────────────────

function selectType(type) {
  currentType = type;

  document.getElementById('tab-days').classList.toggle('active', type === 'days');
  document.getElementById('tab-week').classList.toggle('active', type === 'week');

  // Show the appropriate description
  document.getElementById('desc-days').classList.toggle('hidden', type !== 'days');
  document.getElementById('desc-week').classList.toggle('hidden', type !== 'week');

  // Reveal the form and next button on first selection
  document.getElementById('form-layout').classList.remove('hidden');
  document.getElementById('next-wrap').classList.remove('hidden');

  // Toggle left-column panels
  document.getElementById('panel-days').classList.toggle('hidden', type !== 'days');
  document.getElementById('panel-week').classList.toggle('hidden', type !== 'week');

  // Initialise calendar when days panel becomes visible
  if (type === 'days') {
    renderCalendar();
  }
}

// ── MINI CALENDAR ────────────────────────────

function changeCalMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const label = document.getElementById('cal-month-label');
  const grid  = document.getElementById('mini-cal-grid');
  if (!label || !grid) return;

  label.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = new Date();

  let html = '';
  DAY_HEADERS.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day other-month"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(calYear, calMonth, d);
    const isToday = (
      d === today.getDate() &&
      calMonth === today.getMonth() &&
      calYear  === today.getFullYear()
    );
    const classes = buildDayClasses(dt, isToday);
    html += `<div class="${classes}" data-date="${dt.toISOString().split('T')[0]}" onclick="calDayClick(this)">${d}</div>`;
  }
  grid.innerHTML = html;
}

function buildDayClasses(dt, isToday) {
  const classes = ['cal-day'];
  if (isToday) classes.push('today');

  if (rangeFrom && rangeTo) {
    const from = new Date(rangeFrom);
    const to   = new Date(rangeTo);
    if (dt.getTime() === from.getTime()) classes.push('range-start');
    else if (dt.getTime() === to.getTime()) classes.push('range-end');
    else if (dt > from && dt < to) classes.push('in-range');
  } else if (rangeFrom) {
    const from = new Date(rangeFrom);
    if (dt.getTime() === from.getTime()) classes.push('range-start');
  }
  return classes.join(' ');
}

function calDayClick(el) {
  const dateStr = el.dataset.date;
  if (!dateStr) return;
  if (!rangeFrom || (rangeFrom && rangeTo)) {
    rangeFrom  = dateStr;
    rangeTo    = null;
    pickingEnd = true;
    document.getElementById('date-from').value = dateStr;
    document.getElementById('date-to').value   = '';
  } else if (pickingEnd) {
    if (dateStr < rangeFrom) {
      rangeTo   = rangeFrom;
      rangeFrom = dateStr;
    } else {
      rangeTo = dateStr;
    }
    pickingEnd = false;
    document.getElementById('date-from').value = rangeFrom;
    document.getElementById('date-to').value   = rangeTo;
  }
  renderCalendar();
}

// Sync date inputs → calendar highlight
function syncDateInputs() {
  const fromInput = document.getElementById('date-from');
  const toInput   = document.getElementById('date-to');

  fromInput.addEventListener('change', () => {
    rangeFrom  = fromInput.value || null;
    pickingEnd = !!rangeFrom && !rangeTo;
    renderCalendar();
  });

  toInput.addEventListener('change', () => {
    rangeTo    = toInput.value || null;
    pickingEnd = false;
    renderCalendar();
  });
}

// WEEK DAY TOGGLE
function toggleWeekDay(el) {
  const day = el.dataset.day;
  if (selectedDays.has(day)) {
    selectedDays.delete(day);
    el.classList.remove('selected');
  } else {
    selectedDays.add(day);
    el.classList.add('selected');
  }
}

// VALIDATION & NEXT
//Checks include: - Event name is not empty 
//                - For "Specific Days": at least a start date is selected 
//                - For "Days of Week": at least one day is selected 
//                - Time range is optional, but if provided, should be valid 

function handleNext() {
  const name     = document.getElementById('event-name').value.trim();

  if (!name) {
    alert('Please enter an event name.');
    document.getElementById('event-name').focus();
    return;
  }

  if (currentType === 'days') {
    if (!rangeFrom) {
      alert('Please select a start date.');
      return;
    }
    // Specific Days: no time range needed
    const params = new URLSearchParams({
      name:     name,
      location: document.getElementById('event-location').value.trim(),
      details:  document.getElementById('event-details').value.trim(),
      from:     rangeFrom,
      to:       rangeTo || rangeFrom
    });
    window.location.href = `/event/heatmap_days?${params.toString()}`;

  } else {
    if (selectedDays.size === 0) {
      alert('Please select at least one day of the week.');
      return;
    }
    const timeFrom = document.getElementById('time-from').value;
    const timeTo   = document.getElementById('time-to').value;
    const params = new URLSearchParams({
      name:     name,
      location: document.getElementById('event-location').value.trim(),
      details:  document.getElementById('event-details').value.trim(),
      days:     Array.from(selectedDays).sort().join(','),
      timeFrom: timeFrom,
      timeTo:   timeTo
    });
    window.location.href = `/event/heatmap_times?${params.toString()}`;
  }
}

// ── INIT ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set default date range values (used when days panel opens)
  const today = new Date();
  const later = new Date(today);
  later.setDate(later.getDate() + 30);

  const fmt = d => d.toISOString().split('T')[0];

  document.getElementById('date-from').value = fmt(today);
  document.getElementById('date-to').value   = fmt(later);
  rangeFrom = fmt(today);
  rangeTo   = fmt(later);

  syncDateInputs();
  // Do NOT auto-select a type — wait for user to click a tab
});