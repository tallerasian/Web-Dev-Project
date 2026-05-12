const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", function (event) {
    const firstName       = document.getElementById("firstName").value.trim();
    const lastName        = document.getElementById("lastName").value.trim();
    const email           = document.getElementById("email").value.trim();
    const username        = document.getElementById("username").value.trim();
    const password        = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
        event.preventDefault();
        message.textContent = "Please fill in all fields.";
    } else if (!email.includes("@")) {
        event.preventDefault();
        message.textContent = "Please enter a valid email address.";
    } else if (password.length < 6) {
        event.preventDefault();
        message.textContent = "Password must be at least 6 characters long.";
    } else if (password !== confirmPassword) {
        event.preventDefault();
        message.textContent = "Passwords do not match.";
    }
    // all checks pass — form submits naturally to POST /register
});
