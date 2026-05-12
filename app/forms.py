from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo


class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit   = SubmitField("Sign in")


class RegisterForm(FlaskForm):
    first_name       = StringField("First Name",       validators=[DataRequired()])
    last_name        = StringField("Last Name",        validators=[DataRequired()])
    email            = StringField("Email",            validators=[DataRequired(), Email()])
    username         = StringField("Username",         validators=[DataRequired(), Length(min=3, max=64)])
    password         = PasswordField("Password",       validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField("Confirm",        validators=[DataRequired(), EqualTo("password", message="Passwords must match.")])
    submit           = SubmitField("Register")
