from app import flask_app, db
from app.models import User
from app.forms import LoginForm, RegisterForm
from flask import render_template, redirect, url_for, request, session
from flask_login import login_required, login_user, logout_user
import random
import string


@flask_app.route("/")
def index():
    return redirect(url_for("login_page"))


@flask_app.route("/login", methods=["GET", "POST"])
def login_page():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect(url_for("home_page"))
        return render_template("login.html.jinja", form=form, error="Invalid username or password.")
    return render_template("login.html.jinja", form=form)


@flask_app.route("/register", methods=["GET", "POST"])
def register_page():
    form = RegisterForm()
    if form.validate_on_submit():
        if User.query.filter_by(username=form.username.data).first():
            return render_template("register.html.jinja", form=form, error="Username already taken.")
        if User.query.filter_by(email=form.email.data).first():
            return render_template("register.html.jinja", form=form, error="Email already registered.")
        user = User(
            username=form.username.data,
            email=form.email.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data,
            password_hash=""
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        return redirect(url_for("login_page"))
    return render_template("register.html.jinja", form=form)


@flask_app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login_page"))


@flask_app.route("/home")
@login_required
def home_page():
    events = session.get("events", [])
    return render_template("home.html.jinja", events=events)


@flask_app.route("/event")
@login_required
def create_event():
    return render_template("create_event.html.jinja")


@flask_app.route("/event/heatmap_times")
@login_required
def heatmap_times():
    return render_template("heatmap_times.html.jinja", event={
        "name":      request.args.get("name", "My Event"),
        "days":      request.args.get("days", "0,1,2,3,4,5,6"),
        "time_from": request.args.get("timeFrom", "09:00"),
        "time_to":   request.args.get("timeTo", "17:00"),
        "location":  request.args.get("location", ""),
        "details":   request.args.get("details", ""),
    })


@flask_app.route("/event/heatmap_days")
@login_required
def heatmap_days():
    return render_template("heatmap_days.html.jinja", event={
        "name":     request.args.get("name", "My Event"),
        "from":     request.args.get("from", ""),
        "to":       request.args.get("to", ""),
        "location": request.args.get("location", ""),
        "details":  request.args.get("details", ""),
    })


def generate_event_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@flask_app.route("/event/code")
@login_required
def event_code():
    code       = generate_event_code()
    name       = request.args.get("name", "My Event")
    event_type = request.args.get("type", "days")

    events = session.get("events", [])
    events.append({
        "code":             code,
        "name":             name,
        "type":             event_type,
        "status":           "PENDING",
        "respondent_count": 0,
        "best_time":        None,
    })
    session["events"] = events

    return render_template("code.html.jinja", event={"name": name, "code": code})
