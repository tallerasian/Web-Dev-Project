from app import db
from app.blueprints import main
from app.models import User, Event, EventMember, Availability
from app.forms import LoginForm, RegisterForm
from flask import render_template, redirect, url_for, request, abort, jsonify
from flask_login import login_required, login_user, logout_user, current_user
from datetime import date, time
import random
import string

@main.route("/")
def index():
    return redirect(url_for("main.login_page"))


@main.route("/login", methods=["GET", "POST"])
def login_page():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect(url_for("main.home_page"))
        return render_template("login.html.jinja", form=form, error="Invalid username or password.")
    return render_template("login.html.jinja", form=form)


@main.route("/register", methods=["GET", "POST"])
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
        return redirect(url_for("main.login_page"))
    return render_template("register.html.jinja", form=form)


@main.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.login_page"))


@main.route("/home")
@login_required
def home_page():
    # grab every event this user is part of (as organiser or member)
    memberships = EventMember.query.filter_by(user_id=current_user.id).all()
    events = [m.event for m in memberships]
    join_error = request.args.get("join_error")
    create_event_url = url_for("main.create_event")
    return render_template("home.html.jinja", events=events, join_error=join_error, create_event_url=create_event_url)


@main.route("/event")
@login_required
def create_event():
    return render_template("create_event.html.jinja")


# still needed for the organiser's create flow (URL params, no DB event yet)
@main.route("/event/heatmap_times")
@login_required
def heatmap_times():
    return render_template("heatmap_times.html.jinja", is_owner=True, event={
        "name":      request.args.get("name", "My Event"),
        "days":      request.args.get("days", "0,1,2,3,4,5,6"),
        "time_from": request.args.get("timeFrom", "09:00"),
        "time_to":   request.args.get("timeTo", "17:00"),
        "location":  request.args.get("location", ""),
        "details":   request.args.get("details", ""),
    })


@main.route("/event/heatmap_days")
@login_required
def heatmap_days():
    return render_template("heatmap_days.html.jinja", is_owner=True, event={
        "name":     request.args.get("name", "My Event"),
        "from":     request.args.get("from", ""),
        "to":       request.args.get("to", ""),
        "location": request.args.get("location", ""),
        "details":  request.args.get("details", ""),
    })


# heatmap route for events already in the DB (join flow + revisiting your own event)
@main.route("/event/<int:event_id>/heatmap")
@login_required
def event_heatmap(event_id):
    event = Event.query.get_or_404(event_id)

    # kick out anyone who isn't actually in this event
    member = EventMember.query.filter_by(event_id=event_id, user_id=current_user.id).first()
    if not member:
        abort(403)

    is_owner = (event.organizer_id == current_user.id)

    # build a plain dict so both heatmap templates get the same shape regardless of source
    if event.event_type == 'days':
        event_data = {
            "name":     event.name,
            "from":     event.date_from.isoformat() if event.date_from else "",
            "to":       event.date_to.isoformat()   if event.date_to   else "",
            "location": event.location or "",
            "details":  event.details  or "",
        }
        return render_template("heatmap_days.html.jinja",
                               event=event_data, is_owner=is_owner, event_id=event.id)
    else:
        event_data = {
            "name":      event.name,
            "days":      event.days_of_week or "0,1,2,3,4,5,6",
            "time_from": event.time_from.strftime("%H:%M") if event.time_from else "09:00",
            "time_to":   event.time_to.strftime("%H:%M")   if event.time_to   else "17:00",
            "location":  event.location or "",
            "details":   event.details  or "",
        }
        return render_template("heatmap_times.html.jinja",
                               event=event_data, is_owner=is_owner, event_id=event.id)


def generate_event_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@main.route("/event/code")
@login_required
def event_code():
    # keep retrying until we land on a code that doesn't already exist
    while True:
        code = generate_event_code()
        if not Event.query.filter_by(code=code).first():
            break

    name       = request.args.get("name", "My Event")
    event_type = request.args.get("type", "days")

    event = Event(
        organizer_id = current_user.id,
        code         = code,
        name         = name,
        location     = request.args.get("location", ""),
        details      = request.args.get("details", ""),
        event_type   = event_type,
    )

    if event_type == 'days':
        raw_from = request.args.get("from", "")
        raw_to   = request.args.get("to", "")
        event.date_from = date.fromisoformat(raw_from) if raw_from else None
        event.date_to   = date.fromisoformat(raw_to)   if raw_to   else None
    else:
        event.days_of_week = request.args.get("days", "0,1,2,3,4,5,6")
        raw_from = request.args.get("timeFrom", "09:00")
        raw_to   = request.args.get("timeTo",   "17:00")
        event.time_from = time.fromisoformat(raw_from)
        event.time_to   = time.fromisoformat(raw_to)

    db.session.add(event)
    db.session.flush()  # need event.id before we can create the membership row

    # organiser counts as a member of their own event
    db.session.add(EventMember(event_id=event.id, user_id=current_user.id))
    db.session.commit()

    return redirect(url_for("event_view_code", event_id=event.id))


@main.route("/event/<int:event_id>/code")
@login_required
def event_view_code(event_id):
    event = Event.query.get_or_404(event_id)
    # only members can see the code
    if not EventMember.query.filter_by(event_id=event_id, user_id=current_user.id).first():
        abort(403)
    return render_template("code.html.jinja", event=event, is_owner=(event.organizer_id == current_user.id))


@main.route("/event/<int:event_id>/delete", methods=["POST"])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)

    # only the organiser can wipe the whole event
    if event.organizer_id != current_user.id:
        abort(403)

    db.session.delete(event)  # cascade removes all EventMember rows too
    db.session.commit()
    return redirect(url_for("main.home_page"))


@main.route("/event/<int:event_id>/leave", methods=["POST"])
@login_required
def leave_event(event_id):
    event = Event.query.get_or_404(event_id)

    # organiser can't "leave" — they'd need to delete the whole thing
    if event.organizer_id == current_user.id:
        abort(403)

    membership = EventMember.query.filter_by(
        event_id=event_id, user_id=current_user.id
    ).first_or_404()

    db.session.delete(membership)
    db.session.commit()
    return redirect(url_for("main.home_page"))


@main.route("/event/new", methods=["POST"])
@login_required
def create_event_post():
    event_type = request.form.get("type", "days")
    params = {
        "name":     request.form.get("name", "My Event"),
        "location": request.form.get("location", ""),
        "details":  request.form.get("details", ""),
    }
    if event_type == "days":
        params["from"] = request.form.get("from", "")
        params["to"]   = request.form.get("to",   "")
        return redirect(url_for("heatmap_days", **params))
    else:
        params["days"]     = request.form.get("days", "0,1,2,3,4,5,6")
        params["timeFrom"] = request.form.get("timeFrom", "09:00")
        params["timeTo"]   = request.form.get("timeTo",   "17:00")
        return redirect(url_for("heatmap_times", **params))


@main.route("/event/<int:event_id>/availability", methods=["GET"])
@login_required
def get_availability(event_id):
    if not EventMember.query.filter_by(event_id=event_id, user_id=current_user.id).first():
        abort(403)

    rows        = Availability.query.filter_by(event_id=event_id).all()
    my_slots    = [r.slot_key for r in rows if r.user_id == current_user.id]
    group_data  = {}
    people_data = {}

    for r in rows:
        group_data[r.slot_key] = group_data.get(r.slot_key, 0) + 1
        user    = User.query.get(r.user_id)
        display = "You" if r.user_id == current_user.id else (user.first_name if user else "?")
        bucket  = people_data.setdefault(r.slot_key, [])
        if r.user_id == current_user.id:
            bucket.insert(0, "You")
        else:
            bucket.append(display)

    participant_count = len({r.user_id for r in rows})
    return jsonify(my_slots=my_slots, group_data=group_data, people_data=people_data, participant_count=participant_count)


@main.route("/event/<int:event_id>/availability", methods=["POST"])
@login_required
def save_availability(event_id):
    if not EventMember.query.filter_by(event_id=event_id, user_id=current_user.id).first():
        abort(403)

    data      = request.get_json(silent=True) or {}
    slot_keys = data.get("slots", [])

    Availability.query.filter_by(event_id=event_id, user_id=current_user.id).delete()
    for key in slot_keys:
        db.session.add(Availability(event_id=event_id, user_id=current_user.id, slot_key=key))
    db.session.commit()
    return jsonify(ok=True)


@main.route("/event/join", methods=["POST"])
@login_required
def join_event():
    code = request.form.get("code", "").strip().upper()
    event = Event.query.filter_by(code=code).first()

    if not event:
        return redirect(url_for("main.home_page", join_error="Code not found. Double-check and try again."))

    # only insert a new membership if they're not already in
    already_member = EventMember.query.filter_by(
        event_id=event.id, user_id=current_user.id
    ).first()
    if not already_member:
        db.session.add(EventMember(event_id=event.id, user_id=current_user.id))
        db.session.commit()

    return redirect(url_for("main.event_heatmap", event_id=event.id))
