document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded and parsed");

    formNavigation();
    eventTypeNav();
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