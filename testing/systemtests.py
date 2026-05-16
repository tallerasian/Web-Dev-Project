from unittest import TestCase
from app import create_app, db
from app.config import TestConfig
from multiprocessing import Process
from selenium import webdriver

localhost = "http://localhost:5000"

class SeleniumTests(TestCase):
    def setUp(self):
        self.test_app = create_app(TestConfig)
        self.app_context = self.test_app.app_context()
        self.app_context.push()

        self.server_thread = Process(target = self.test_app.run)
        self.server_thread.start()

        # run browser in headless mode; does not make browser window
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")

        self.driver = webdriver.Chrome(options = options)
        self.driver.get(localhost)

    def test_unittest_is_working(self):
        print("Hello World")
        
    def tearDown(self):
        self.server_thread.terminate()
        self.driver.close()
        db.session.remove()
        db.drop_all()
        self.app_context.pop()