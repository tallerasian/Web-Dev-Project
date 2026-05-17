# Web-Dev-Project

# Project Description

Our project application is called Synced, which takes inspiration from the website when2meet and improves it in every way. 
### Goal
Main goal is to make it easier for people to arrange a time or a day to meet up. Synced makes it easy to visualise and communicate with others to find a perfect time to meet. 

### Design 

    Synced is designed to be easy to use and user friendly. You should be able to 
    TODO: Explain the design and use of the project here.

# Collaborators

| Name    | UWA ID   | Github Username |
| ------- | -------- | --------------- |
| Ray     | 24278395 | tallerasian     |
| Francis | 23744262 | TheRobbie73     |
| Irtiza  | 25086045 | Irtizaanam      |

# Launching the Application

## 1. Setting up the Python virtual environment

In order to launch the application, a virtual environment with the necessary modules must be activated.

>Create directory for virtual environment.
    
    python3 -m venv .venv

>Activate the virtual environment.

>for MacOS/Linux:
    
    source .venv/bin/activate

>for Windows:
    
    .venv\Scripts\activate

>Install dependencies.

    pip install -r requirements.txt


## 2. Starting the Flask application

>Run application in dev environment.

    flask --app app/synced.py run

The app can then be accessed from http://localhost:5000. 

---

### Hosting on LAN

Alternatively, the app can be hosted on LAN, where devices on the same network can connect to the app.

>Run application for LAN

    flask --app app/synced.py run --host 0.0.0.0 --with-threads

The flask app will log the URLs that it is serving on for localhost and LAN.

    * Running on all addresses (0.0.0.0)
    * Running on http://127.0.0.1:5000
    * Running on http://[LAN IP]:5000 <- enter into other device browser

This may not work on certain networks (such as library or university Wi-Fi) that block connections between devices. The host must also configure their firewall to open the appropriate port for traffic (i.e. port 5000)

---

>Stop running application

    Press [CTRL + C] to quit

# Testing the Application

To run the unit tests, execute the following in the terminal:

    python -m unittest testing/unittests.py -v

Results for each test will be printed onto the terminal. To run the system tests instead:

    python -m unittest testing/systemtests.py -v
