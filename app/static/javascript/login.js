var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var registerBtn = document.getElementById("registerBtn");
var signinBtn = document.getElementById("signinBtn");
var joinBtn = document.getElementById("joinBtn");
var message = document.getElementById("message");

// Helper: display a message with an optional style variant
function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + (type || "");
}

// Validate that both fields are filled
function validateFields() {
    if (usernameInput.value.trim() === "") {
        showMessage("Please enter a username.", "error");
        usernameInput.focus();
        return false;
    }
    if (passwordInput.value.trim() === "") {
        showMessage("Please enter a password.", "error");
        passwordInput.focus();
        return false;
    }
    return true;
}

// Sign in button
signinBtn.addEventListener("click", function () {
    if (!validateFields()) return;
    var user = usernameInput.value.trim();
    console.log("Sign-in attempted for user:", user);
    showMessage("Signing in as " + user + "...", "info");
});

// Register button
registerBtn.addEventListener("click", function () {
    if (!validateFields()) return;
    var user = usernameInput.value.trim();
    console.log("Register attempted for user:", user);
    showMessage("Registering account for " + user + "...", "info");
});

// Join event link
joinBtn.addEventListener("click", function (event) {
    event.preventDefault();
    console.log("Join event clicked");
    showMessage("Join-an-event in progress", "info");
});

// Clear message when the user starts typing again
usernameInput.addEventListener("input", function () { showMessage(""); });
passwordInput.addEventListener("input", function () { showMessage(""); });