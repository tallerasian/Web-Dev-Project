# Main application module
from app import create_app
from app.config import DeploymentConfig

flask_app = create_app(DeploymentConfig)