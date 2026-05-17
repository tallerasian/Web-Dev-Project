from unittest import TestCase
from app import create_app, db
from app.config import TestConfig
from app.models import User, Event, EventMember
from app.functionality import add_user, add_event
from multiprocessing import Process
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from datetime import date, time

localhost = "http://localhost:5000"

class SeleniumTests(TestCase):
    def setUp(self):
        self.test_app = create_app(TestConfig)
        self.app_context = self.test_app.app_context()
        self.app_context.push()

        self.server_thread = Process(target = self.test_app.run)
        self.server_thread.start()

        options = Options()
        options.add_argument("--headless")

        self.driver = webdriver.Firefox(options = options)
        self.driver.implicitly_wait(5)
        self.driver.get(localhost)

    def test_user_registration(self):
        """Test registering a new account and logging in with said account"""
        register_button = self.driver.find_element(By.ID, "registerBtn")
        register_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/register", "Failed to reach register page.")

        first_name_field = self.driver.find_element(By.ID, "firstName")
        last_name_field = self.driver.find_element(By.ID, "lastName")
        email_field = self.driver.find_element(By.ID, "email")
        username_field = self.driver.find_element(By.ID, "username")
        password_field = self.driver.find_element(By.ID, "password")
        confirm_password_field = self.driver.find_element(By.ID, "confirmPassword")

        fields = [first_name_field, last_name_field, email_field, username_field, password_field, confirm_password_field]
        inputs = ["Robert", "Lastname", "bob.last@gmail.com", "Baubles123", "password", "password"]
        for field, input in zip(fields, inputs):
            field.clear()
            field.send_keys(input)
        
        submit_button = self.driver.find_element(By.ID, "submit-btn")
        submit_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/login", "Did not return to login page after registering.")

        login_username = self.driver.find_element(By.ID, "username")
        login_password = self.driver.find_element(By.ID, "password")
        signin_button = self.driver.find_element(By.ID, "signinBtn")

        login_username.clear()
        login_username.send_keys("Baubles123")
        login_password.clear()
        login_password.send_keys("password")
        signin_button.click()

        self.assertIsNotNone(User.query.filter_by(username = "Baubles123").first(), "Failed to store user in database")
        self.assertEqual(self.driver.current_url, localhost + "/home", "Failed to reach home page after logging in")
        
    def test_day_event_creation(self):
        """Test creating an event for a specific day"""
        add_user("AllAsAlice100", "alice.ann@student.uni.edu", "Alice", "Ann", "SuperSecurePassword123")

        login_username = self.driver.find_element(By.ID, "username")
        login_password = self.driver.find_element(By.ID, "password")
        signin_button = self.driver.find_element(By.ID, "signinBtn")

        login_username.clear()
        login_username.send_keys("AllAsAlice100")
        login_password.clear()
        login_password.send_keys("SuperSecurePassword123")
        signin_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/home", "Failed to reach home page after logging in")

        create_event_button = self.driver.find_element(By.ID, "create-event-button")
        create_event_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/event", "Failed to reach create event page")

        specific_days_button = self.driver.find_element(By.ID, "tab-days")
        specific_days_button.click()

        date_from_field = self.driver.find_element(By.ID, "date-from")
        date_to_field = self.driver.find_element(By.ID, "date-to")
        event_name_field = self.driver.find_element(By.ID, "event-name")
        event_location_field = self.driver.find_element(By.ID, "event-location")
        event_details_field = self.driver.find_element(By.ID, "event-details")

        fields = [date_from_field, date_to_field, event_name_field, event_location_field, event_details_field]
        inputs = ["2026-05-01", "2026-05-31", "Study Group Meetup", "Room 1000", "Bring your chargers!!!"]
        for field, input in zip(fields, inputs):
            field.clear()
            field.send_keys(input)

        submit_button = self.driver.find_element(By.ID, "next-btn")
        submit_button.click()

        self.assertIn(localhost + "/event/heatmap_days", self.driver.current_url, "Failed to reach event heatmap page")

        number_of_day_buttons = len(self.driver.find_elements(By.CLASS_NAME, "in-range"))
        self.assertEqual(number_of_day_buttons, 31, f"Expected 31 selectable day buttons, but instead got {number_of_day_buttons}")
        for i in range(31):
            day_buttons = self.driver.find_elements(By.CLASS_NAME, "in-range")
            day_buttons[i].click()

        code_button = self.driver.find_element(By.ID, "go-to-code")
        code_button.click()

        self.assertIn("code", self.driver.current_url, "Failed to reach event code page")
        
        code = self.driver.find_element(By.CLASS_NAME, "share-code-large").text
        event = Event.query.filter_by(code = code).first()
        event_count = Event.query.count()

        self.assertEqual(event_count, 1, "Failed to create an event in the database")
        self.assertIsNotNone(event, "Could not find event with the given event code in the database")
        
    def test_weekly_event_creation(self):
        """Test creating an event that occurs weekly"""
        add_user("AllAsAlice100", "alice.ann@student.uni.edu", "Alice", "Ann", "SuperSecurePassword123")

        login_username = self.driver.find_element(By.ID, "username")
        login_password = self.driver.find_element(By.ID, "password")
        signin_button = self.driver.find_element(By.ID, "signinBtn")

        login_username.clear()
        login_username.send_keys("AllAsAlice100")
        login_password.clear()
        login_password.send_keys("SuperSecurePassword123")
        signin_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/home", "Failed to reach home page after logging in")

        create_event_button = self.driver.find_element(By.ID, "create-event-button")
        create_event_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/event", "Failed to reach create event page")

        days_of_week_button = self.driver.find_element(By.ID, "tab-week")
        days_of_week_button.click()

        week_day_buttons = self.driver.find_elements(By.CLASS_NAME, "week-day-cell")
        for day in week_day_buttons:
            day.click()

        event_name_field = self.driver.find_element(By.ID, "event-name")
        event_location_field = self.driver.find_element(By.ID, "event-location")
        event_details_field = self.driver.find_element(By.ID, "event-details")

        fields = [event_name_field, event_location_field, event_details_field]
        inputs = ["Weekly Meetup", "Bob's House", "Snacks are included"]
        for field, input in zip(fields, inputs):
            field.clear()
            field.send_keys(input)

        submit_button = self.driver.find_element(By.ID, "next-btn")
        submit_button.click()

        self.assertIn(localhost + "/event/heatmap_times", self.driver.current_url, "Failed to reach event heatmap page")
        
        code_button = self.driver.find_element(By.ID, "go-to-code")
        code_button.click()

        self.assertIn("code", self.driver.current_url, "Failed to reach event code page")

    def test_joining_event(self):
        alice_id = add_user("AllAsAlice100", "alice.ann@student.uni.edu", "Alice", "Ann", "SuperSecurePassword123")
        bob_id = add_user("Baubles123", "bob.last@gmail.com", "Robert", "Lastname", "password")
        event_id = add_event(
            bob_id, 
            "Bob's Martial Arts", 
            "123 Flowers St.", 
            "Learn from the best", 
            "days", 
            (date(2026, 5, 1), date(2026, 5, 31)),
            "0,1,2,3,4,5,6",
            (time(9), time(17))
        )

        code = Event.query.filter_by(id = event_id).first().code

        login_username = self.driver.find_element(By.ID, "username")
        login_password = self.driver.find_element(By.ID, "password")
        signin_button = self.driver.find_element(By.ID, "signinBtn")

        login_username.clear()
        login_username.send_keys("AllAsAlice100")
        login_password.clear()
        login_password.send_keys("SuperSecurePassword123")
        signin_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/home", "Failed to reach home page after logging in")

        nav_buttons = self.driver.find_elements(By.CLASS_NAME, "nav-tab")
        nav_buttons[2].click()
        code_input = self.driver.find_element(By.ID, "join-code-input")
        code_input.clear()
        code_input.send_keys(code)
        code_button = self.driver.find_element(By.ID, "join-event-button")
        code_button.click()

        for i in range(31):
            day_buttons = self.driver.find_elements(By.CLASS_NAME, "in-range")
            day_buttons[i].click()

        code_button = self.driver.find_element(By.ID, "go-to-home")
        code_button.click()

        self.assertEqual(self.driver.current_url, localhost + "/home", "Failed to reach home page after setting availability")

        event_cards = self.driver.find_elements(By.CLASS_NAME, "event-card")
        self.assertEqual(len(event_cards), 1, "Failed to show user joined event")

        isAliceInEvent = EventMember.query.filter_by(event_id = event_id, user_id = alice_id).count() > 0
        participantCount = EventMember.query.filter_by(event_id = event_id).count()

        self.assertTrue(isAliceInEvent, "Alice failed to join event")
        self.assertEqual(participantCount, 2, f"Expected 2 members in Bob's event, instead got {participantCount}")



    def tearDown(self):
        self.server_thread.terminate()
        self.driver.close()
        db.drop_all()
        db.session.remove()
        self.app_context.pop()