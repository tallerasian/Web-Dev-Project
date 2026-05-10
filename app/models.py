from app import db, bcrypt
from flask_login import UserMixin
from datetime import datetime, timezone


class User(UserMixin, db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(64),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    first_name    = db.Column(db.String(64),  nullable=False)
    last_name     = db.Column(db.String(64),  nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"


class Event(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    organizer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code         = db.Column(db.String(6),   unique=True, nullable=False)
    name         = db.Column(db.String(120), nullable=False)
    location     = db.Column(db.String(120), default='')
    details      = db.Column(db.Text,        default='')

    # either 'days' (specific date range) or 'week' (recurring days of the week)
    event_type   = db.Column(db.String(10), nullable=False)

    # only used when event_type == 'days'
    date_from    = db.Column(db.Date, nullable=True)
    date_to      = db.Column(db.Date, nullable=True)

    # only used when event_type == 'week'
    days_of_week = db.Column(db.String(20), nullable=True)  # stored as "0,2,4" etc.
    time_from    = db.Column(db.Time, nullable=True)
    time_to      = db.Column(db.Time, nullable=True)

    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # who made this event
    organizer      = db.relationship('User', backref='owned_events')

    # everyone in the event (organiser included) — deleting the event cleans up members too
    members        = db.relationship('EventMember',  backref='event', cascade='all, delete-orphan')

    # selected heatmap slots — deleting the event wipes these too
    availabilities = db.relationship('Availability', backref='event', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Event {self.code} '{self.name}'>"


class EventMember(db.Model):
    # tracks who's in which event — one row per user per event
    id        = db.Column(db.Integer, primary_key=True)
    event_id  = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    user_id   = db.Column(db.Integer, db.ForeignKey('user.id'),  nullable=False)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # can't join the same event twice
    __table_args__ = (db.UniqueConstraint('event_id', 'user_id'),)

    def __repr__(self):
        return f"<EventMember event={self.event_id} user={self.user_id}>"


class Availability(db.Model):
    # one row per selected slot per user per event
    id       = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    user_id  = db.Column(db.Integer, db.ForeignKey('user.id'),  nullable=False)
    slot_key = db.Column(db.String(20), nullable=False)  # "YYYY-MM-DD" or "dayIndex-absoluteSlot"

    __table_args__ = (db.UniqueConstraint('event_id', 'user_id', 'slot_key'),)

    def __repr__(self):
        return f"<Availability event={self.event_id} user={self.user_id} slot={self.slot_key}>"


class Availability(db.Model):
    # one row per selected slot per user per event
    id       = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    user_id  = db.Column(db.Integer, db.ForeignKey('user.id'),  nullable=False)
    slot_key = db.Column(db.String(20), nullable=False)  # "YYYY-MM-DD" or "dayIndex-absoluteSlot"

    __table_args__ = (db.UniqueConstraint('event_id', 'user_id', 'slot_key'),)

    def __repr__(self):
        return f"<Availability event={self.event_id} user={self.user_id} slot={self.slot_key}>"
