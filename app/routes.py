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

@flask_app.route("/create_event")
def create_event():
    return render_template("create_event.html.jinja")

@flask_app.route("/heatmap_days")
def heatmap_days():
    return render_template("heatmap_days.html.jinja")

@flask_app.route("/heatmap_times")
def heatmap_times():
    return render_template("heatmap_times.html.jinja")
