from app import flask_app
from flask import render_template


@flask_app.route("/")
def login_page():
    return render_template("login.html.jinja")

@flask_app.route("/home")
def home_page():
    return render_template("home.html.jinja")

@flask_app.route("/register")
def register_page():
    return render_template("register.html")


