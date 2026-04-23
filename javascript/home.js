
function switchTab(btn, tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
}

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const eventDays = [3, 9, 14, 21];
let calYear, calMonth;

function buildCalendar() {
    const now = new Date();
    if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }
    document.getElementById('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`;
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
    let html = DAYS.map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = isCurrentMonth && d === now.getDate();
        const hasEvent = eventDays.includes(d);
        let cls = 'cal-day' + (isToday ? ' today' : '') + (hasEvent ? ' has-event' : '');
        html += `<div class="${cls}">${d}</div>`;
    }
    document.getElementById('cal-grid').innerHTML = html;
}

function calNav(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0)  { calMonth = 11; calYear--; }
    buildCalendar();
}

buildCalendar();

// Join event form handling
function submitJoinCode() {
    const input = document.getElementById('join-code-input');
    const feedback = document.getElementById('join-feedback');
    const code = input.value.trim().toUpperCase();

    if (code.length < 6) {
        feedback.textContent = 'Code must be 6 characters.';
        feedback.className = 'join-feedback error';
        return;
    }

    // TODO: replace this block with your real API call
    feedback.textContent = 'Checking code...';
    feedback.className = 'join-feedback';

    setTimeout(() => {
        // Simulate a response — swap this out for a fetch() to your backend
        feedback.textContent = `Code "${code}" not found. Check with your organiser.`;
        feedback.className = 'join-feedback error';
    }, 800);
}

// Auto-uppercase as user types
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('join-code-input');
    if (input) {
        input.addEventListener('input', () => {
            const pos = input.selectionStart;
            input.value = input.value.toUpperCase();
            input.setSelectionRange(pos, pos);
        });
    }
});