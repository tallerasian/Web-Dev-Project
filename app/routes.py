from app import flask_app
from flask import render_template

@flask_app.route("/")
def home_page():
    return render_template("home.html")

@flask_app.route("/register")
def register():
    return render_template("register.html")

@flask_app.route("/")
def login_page():
    return render_template("login.html")    