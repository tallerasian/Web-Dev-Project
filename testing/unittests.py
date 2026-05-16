from app import create_app, db
from app.config import TestConfig
from unittest import TestCase

class BasicTests(TestCase):
    def setUp(self):
        test_app = create_app(TestConfig)
        self.app_context = test_app.app_context()
        self.app_context.push()

        # perform additional setup steps here (e.g. adding data to the database)
    
    def test_unittest_is_working(self):
        print("Hello World")
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()