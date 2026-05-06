from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from app.config import Config

flask_app = Flask(__name__)
flask_app.config.from_object(Config)

db = SQLAlchemy(flask_app)
login_manager = LoginManager(flask_app)
login_manager.login_view = "login_page"

from app import routes, models

@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(int(user_id))
