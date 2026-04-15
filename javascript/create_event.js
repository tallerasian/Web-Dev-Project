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

    // define inner function so that it has access to outer variables
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

function eventTypeNav() {
    const eventType = document.getElementById("event-type");
    const dayEvent = document.getElementById("day-event");
    const weeklyEvent = document.getElementById("weekly-event");
    const dayEventTab = document.getElementById("day-event-tab");
    const weeklyEventTab = document.getElementById("weekly-event-tab");

    function updateEventType() {
        dayEventTab.classList.toggle("active", dayEvent.checked);
        weeklyEventTab.classList.toggle("active", weeklyEvent.checked);
    }

    eventType.addEventListener("change", updateEventType);

    updateEventType();
}