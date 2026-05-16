from app import create_app
from app.config import TestConfig

test_app = create_app(TestConfig)