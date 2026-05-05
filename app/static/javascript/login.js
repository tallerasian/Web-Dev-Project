var form = document.getElementById("loginForm");
var username = document.getElementById("username");
var password = document.getElementById("password");
var registerBtn = document.getElementById("registerBtn");
var joinBtn = document.getElementById("joinBtn");
var message = document.getElementById("message");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (username.value.trim() === "" || password.value.trim() === "") {
        message.innerHTML = "Please fill in both fields.";
    } else {
        message.innerHTML = "Sign in button clicked.";
    }
});

registerBtn.addEventListener("click", function() {
    message.innerHTML = "Register button clicked.";
});

joinBtn.addEventListener("click", function() {
    message.innerHTML = "Join event button clicked.";
});
