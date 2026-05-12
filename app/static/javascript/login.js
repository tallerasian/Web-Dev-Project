var form = document.getElementById("loginForm");
var username = document.getElementById("username");
var password = document.getElementById("password");
var message = document.getElementById("message");

form.addEventListener("submit", function(event) {
    if (username.value.trim() === "" || password.value.trim() === "") {
        event.preventDefault();
        message.innerHTML = "Please fill in both fields.";
    }
});
