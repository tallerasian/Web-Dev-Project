from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect


db = SQLAlchemy()
bcrypt = Bcrypt()
csrf = CSRFProtect()  # makes csrf_token() available in all templates
login_manager = LoginManager()
login_manager.login_view = "login_page"

def create_app(config):
    flask_app = Flask(__name__)
    flask_app.config.from_object(config)

    db.init_app(flask_app)
    bcrypt.init_app(flask_app)
    csrf.init_app(flask_app)
    login_manager.init_app(flask_app)

    with flask_app.app_context():
        db.create_all()
    
    return flask_app

from app import routes, models

@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(int(user_id))

