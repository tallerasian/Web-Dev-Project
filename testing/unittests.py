from app import create_app, db
from app.config import TestConfig
from app.functionality import add_event, add_user
from app.models import User
from unittest import TestCase

class BasicTests(TestCase):
    def setUp(self):
        test_app = create_app(TestConfig)
        self.app_context = test_app.app_context()
        self.app_context.push()

        # perform additional setup steps here (e.g. adding data to the database)

    def test_password_encryption(self):
        """Test password encryption"""

        user = User()
        password = "password123"
        user.set_password(password)
        encrypted = user.password_hash

        self.assertNotEqual(password, encrypted, "Password has not been encrypted")
        self.assertTrue(user.check_password(password), "Checking encrypted password has failed")

        new_user = User()
        new_password = "password123"
        new_user.set_password(new_password)
        new_encrypted = new_user.password_hash

        self.assertNotEqual(encrypted, new_encrypted, "Password salting has failed")


        
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()