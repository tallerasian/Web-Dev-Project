from unittest import TestCase
from app import create_app, db
from app.config import TestConfig
from app.models import User
from multiprocessing import Process
from selenium import webdriver

from selenium.webdriver import Keys, ActionChains
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.by import By

localhost = "http://localhost:5000"

class SeleniumTests(TestCase):
    def setUp(self):
        self.test_app = create_app(TestConfig)
        self.app_context = self.test_app.app_context()
        self.app_context.push()

        self.server_thread = Process(target = self.test_app.run)
        self.server_thread.start()

        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(1)
        self.driver.get(localhost)

    def test_user_registration(self):
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
        
        submit_button = self.driver.find_element(By.CLASS_NAME, "btn")
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
        

        
    def tearDown(self):
        self.server_thread.terminate()
        self.driver.close()
        db.session.remove()
        db.drop_all()
        self.app_context.pop()