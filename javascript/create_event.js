document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded and parsed");

    formNavigation();
    eventTypeNav();
    dailyCalender();
})

function formNavigation() {
    let currentStep = 0;

    const progress = document.getElementsByClassName("node");
    const steps = document.getElementsByClassName("step");

    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const submitButton = document.getElementById("submit");

    // makes the current tab visible and greys out the previous, next, and make event buttons accordingly
    function updateProgress() {
        for (let i = 0; i < 3; i++) {
            progress[i].classList.toggle("active", currentStep === i);
            steps[i].classList.toggle("active", currentStep === i);
        }

        prevButton.disabled = (currentStep === 0);
        nextButton.disabled = (currentStep === 2);
        submitButton.disabled = (currentStep !== 2);
    }

    prevButton.addEventListener("click", () => {
        if (currentStep > 0) currentStep--;
        updateProgress()
    });

    nextButton.addEventListener("click", () => {
        if (currentStep < 2) currentStep++;
        updateProgress()
    });

    updateProgress();
}

// makes certain sections visible based on which event type was chosen (specific day event vs. weekly event)
function eventTypeNav() {
    const eventType = document.getElementById("event-type");
    const dayEvent = document.getElementById("day-event");
    const weeklyEvent = document.getElementById("weekly-event");

    const dayEventTab = document.getElementById("day-event-tab");
    const dayEventAvailability = document.getElementById("day-event-availability");

    const weeklyEventTab = document.getElementById("weekly-event-tab");
    const weeklyEventAvailability = document.getElementById("weekly-event-availability");

    function updateEventType() {
        dayEventTab.classList.toggle("active", dayEvent.checked);
        dayEventAvailability.classList.toggle("active", dayEvent.checked);

        weeklyEventTab.classList.toggle("active", weeklyEvent.checked);
        weeklyEventAvailability.classList.toggle("active", weeklyEvent.checked);
    }

    eventType.addEventListener("change", updateEventType);

    updateEventType();
}


function dailyCalender() {
    const monthLabel = document.getElementById('cal-month-label');
    const calGrid = document.getElementById('cal-grid');

    const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let calYear, calMonth;

    function buildCalender() {
        const now = new Date();
        if (calYear === undefined) {
            calYear = now.getFullYear();
            calMonth = now.getMonth();
        }

        monthLabel.textContent = `${MONTHS[calMonth]} ${calYear}`;

        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        DAYS.map(day => {
            const dayDiv = document.createElement("div");
            const dayContent = document.createTextNode(day);
            dayDiv.appendChild(dayContent);
            dayDiv.classList.add("cal-day-header");
            calGrid.appendChild(dayDiv);
        });

        // add empty day cells
        for (let day = 0; day < firstDay; day++) {
            const dayDiv = document.createElement("div");
            dayDiv.classList.add("cal-day", "empty");
            calGrid.appendChild(dayDiv);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement("div");
            const dayContent = document.createTextNode(day);
            dayDiv.appendChild(dayContent);
            dayDiv.classList.add("cal-day");
            calGrid.appendChild(dayDiv);
        }
    }

    function calNav(dir) {
        calMonth += dir;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        if (calMonth < 0)  { calMonth = 11; calYear--; }
        buildCalendar();
    }

    const prevMonth = document.getElementById("cal-nav-prev");
    const nextMonth = document.getElementById("cal-nav-next");

    prevMonth.addEventListener("onclick", function() { calNav(-1); });
    nextMonth.addEventListener("onclick", function() { calNav(1); });

    buildCalender();
}