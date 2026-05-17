from app import create_app, db
from app.config import TestConfig
from app.functionality import add_event, add_user
from app.models import User, Event
from unittest import TestCase
from datetime import date, time

class BasicTests(TestCase):
    def setUp(self):
        test_app = create_app(TestConfig)
        self.app_context = test_app.app_context()
        self.app_context.push()

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

    def test_adding_users(self):
        """Test adding users to the database"""
        for i in range(20):
            test_name = f"testname{i}"
            add_user(
                test_name,
                f"{test_name}@example.com",
                test_name,
                "testington",
                f"password{i}"
            )

        users = User.query.count()
        self.assertEqual(users, 20, f"Expected 20 users in the database, instead got {users}")
    
    def test_adding_events(self):
        """Test adding events to the database"""
        add_user(
            "organiser",
            "org@example.com",
            "orga",
            "niser",
            "password"
        )
        
        user = User.query.filter_by(username = "organiser").first()
        for i in range(20):
            add_event(
                user.id,
                f"event{i}",
                "organiser's house",
                "organiser awesome party",
                "week" if i % 2 else "days",
                (date(2026, 5, 1), date(2026, 5, 31)),
                "0,1,2,3,4,5,6",
                (time(9), time(17))
            )
        
        events = Event.query.filter_by(organizer_id = user.id).count()
        self.assertEqual(events, 20, f"Expected 20 events in the database, instead got {events}")
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()