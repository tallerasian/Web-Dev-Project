from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect
from app.config import Config

flask_app = Flask(__name__)
flask_app.config.from_object(Config)

db = SQLAlchemy(flask_app)
bcrypt = Bcrypt(flask_app)
csrf = CSRFProtect(flask_app)  # makes csrf_token() available in all templates
login_manager = LoginManager(flask_app)
login_manager.login_view = "login_page"

from app import routes, models

@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(int(user_id))

with flask_app.app_context():
    db.create_all()
