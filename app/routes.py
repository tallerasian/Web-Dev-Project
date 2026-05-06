from app import flask_app
from flask import render_template, redirect, url_for
from flask_login import login_required
import random
import string


@flask_app.route("/")
def index():
    return redirect(url_for("login_page"))

@flask_app.route("/home")
@login_required
def home_page():
    return render_template("home.html.jinja")

@flask_app.route("/login")
def login_page():
    return render_template("login.html.jinja")

@flask_app.route("/register")
def register_page():
    return render_template("register.html.jinja")

@flask_app.route("/event")
@login_required
def create_event():
    return render_template("create_event.html.jinja")

@flask_app.route("/event/heatmap_times")
@login_required
def heatmap_times():
    return render_template("heatmap_times.html.jinja", event={"name": "My Event", "code": "ABC123"})

@flask_app.route("/event/heatmap_days")
@login_required
def heatmap_days():
    return render_template("heatmap_days.html.jinja", event={"name": "My Event", "code": "ABC123"})


def generate_event_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@flask_app.route("/event/code")
@login_required
def event_code():
    code = generate_event_code()
    return render_template("code.html.jinja", event={"name": "My Event", "code": code})
