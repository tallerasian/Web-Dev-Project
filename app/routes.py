from app import flask_app
from flask import render_template

@flask_app.route("/login")
def login():
    return render_template("login.html.jinja")

@flask_app.route("/")
def home_page():
    return render_template("home.html.jinja")

@flask_app.route("/create_event")
def event_page():
    return render_template("create_event.html.jinja")