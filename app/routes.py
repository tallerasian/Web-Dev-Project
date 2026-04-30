from app import flask_app
from flask import render_template

@flask_app.route("/login")
def login():
    return render_template("login.html.jinja")

@flask_app.route("/")
def login_page():
    return render_template("login.html")
