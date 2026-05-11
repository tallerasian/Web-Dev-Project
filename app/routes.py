from app import flask_app
from flask import render_template
import random
import string

@flask_app.route("/")
def home_page():
    return render_template("home.html")


@flask_app.route("/login")
def login_page():
    return render_template("login.html")    

def login_page():
    return render_template("login.html.jinja")

@flask_app.route("/home")
def home_page():
    return render_template("home.html.jinja")

@flask_app.route("/register")
def register_page():
    return render_template("register.html.jinja")

@flask_app.route("/event")
def create_event():
    return render_template("create_event.html.jinja")

@flask_app.route("/event/heatmap_times")
def heatmap_times():
    return render_template("heatmap_times.html.jinja", event={"name": "My Event", "code": "ABC123"})

@flask_app.route("/event/heatmap_days")
def heatmap_days():
    return render_template("heatmap_days.html.jinja", event={"name": "My Event", "code": "ABC123"})


#generate code for new event any letter and any numberm 
def generate_event_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@flask_app.route("/event/code")
def event_code():
    code = generate_event_code()
    # save code to db alongside the event
    return render_template("code.html.jinja", event={"name": "My Event", "code": code})

