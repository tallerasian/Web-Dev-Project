document.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM loaded and parsed");

    let currentStep = 0;

    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const submitButton = document.getElementById("submit");


    // define inner function so that it has access to outer variables
    function updateProgress() {
        // update buttons
        prevButton.disabled = (currentStep === 0);
        nextButton.disabled = (currentStep === 2);
        submitButton.disabled = (currentStep !== 2);
    }

    prevButton.addEventListener("click", (event) => {
        if (currentStep > 0) currentStep--;
        updateProgress()
    });

    nextButton.addEventListener("click", (event) => {
        if (currentStep < 2) currentStep++;
        updateProgress()
    });
})
