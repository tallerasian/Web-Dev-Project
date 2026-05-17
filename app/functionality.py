from app import db
from app.models import User, Event, EventMember
import random
import string
from datetime import date, time

def add_user(username, email, first_name, last_name, password):
    """Adds a user with the following info into the database"""
    user = User(
        username = username,
        email = email,
        first_name = first_name,
        last_name = last_name,
        password_hash = ""
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return user.id

def generate_event_code():
    """Generates a 6-character code unique to the database"""
    code = ''
    # keep retrying until we land on a code that doesn't already exist
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Event.query.filter_by(code=code).first():
            break
    return code

def add_event(
        organizer_id,
        name,
        location,
        details,
        event_type,
        date_range,
        days_of_week,
        time_range
):
    """Adds an event with the following info into the database"""
    event = Event(
        organizer_id = organizer_id,
        code = generate_event_code(),
        name = name,
        location = location,
        details = details,
        event_type = event_type
    )

    if event_type == "days":
        event.date_from, event.date_to = date_range
    else:
        event.days_of_week = days_of_week
        event.time_from, event.time_to = time_range

    db.session.add(event)
    db.session.flush() # need event.id before we can create the membership row

    # organiser counts as a member of their own event
    db.session.add(EventMember(event_id=event.id, user_id=organizer_id))
    db.session.commit()

    return event.id