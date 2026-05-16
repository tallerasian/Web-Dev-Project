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

The following test procedures walk through all major features of Synced. To run them, ensure the application is already running at http://localhost:5000 (see *Launching the Application* above).

For full coverage, open **two separate browser windows** (or use a private/incognito window alongside your main one) so you can simulate two different users.

---

## Test 1 — User Registration and Login

**Purpose:** Verify that account creation and authentication work correctly.

1. Navigate to http://localhost:5000. You should be redirected to the login page.
2. Click **Register** and fill in the form with a new account (eg. (e.g. `alice` / `alice@test.com`))
3. Submit the form. You should be redirected to the home dashboard.
4. Click **Logout** in the header.
5. Log back in with the same credentials. You should return to the dashboard.

**Validation checks:**
- Try registering with a username that already exists — an error message should appear.
- Try logging in with the wrong password — an error message should appear.
- Try submitting the register form with mismatched passwords — an inline error should appear before the form is sent.

-----------------------

## Test 2 — Creating a Specific-Days Event

**Purpose:** Verify event creation using a date range with a calendar picker.

1. Log into `alice` account and click **Create Event** on the dashboard.
2. Select **Specific Days** as the event type.
3. Enter an event name (e.g. `Study Group`) and optionally a location and details.
4. Pick a date range using the calendar (e.g. the next 7 days).
5. Click **Create Event**.
6. You should land on the **availability heatmap** for the selected dates.
7. Click and drag across cells to mark your available days.
8. Click **Done** — you should be taken to the event code page showing a 6-character share code.

-----------------------

## Test 3 — Creating a Days-of-the-Week Event

**Purpose:** Verify event creation for recurring weekly schedules.

1. Log in as `alice` and click **Create Event**.
2. Select **Days of the Week** as the event type.
3. Enter an event name (e.g. `Weekly Meetup`).
4. Choose which days (e.g. Mon, Wed, Fri) and a time range (e.g. 9:00 AM – 5:00 PM).
5. Click **Create Event**.
6. You should land on the **time-slot heatmap** for the selected days and time range.
7. Click and drag across time slots to mark your availability.
8. Click **Done** — you should see the share code page.

-----------------------

## Test 4 — Joining an Event and Viewing Group Availability

**Purpose:** Verify that a second user can join an event and that the heatmap reflects both users' availability.

1. Copy the 6-character event code from Test 2 or Test 3.
2. In a **second browser window**, register and log in as a new user (e.g. `bob` / `bob@test.com`).
3. On the dashboard, enter the event code in the **Join an Event** field and click **Join**.
4. You should land on the same heatmap. Select different time slots than `alice`.
5. Click **Done**.
6. Now switch back to `alice`'s window and reload the heatmap for that event.
7. The heatmap cells should now show heat colours — darker cells indicate more people are available at that time.
8. Hover over a cell to see a panel listing which users are available at that slot.

**What to look for:**
- Cells where both users are available should appear at the highest heat level.
- The **Most Popular Time** banner should highlight the best overlapping slot.

-----------------------

## Test 5 — Dashboard Navigation

**Purpose:** Verify that the home dashboard correctly displays events and the calendar view.

1. Log in as `alice`, who should now have at least two events.
2. On the dashboard, confirm both events appear in the **My Events** tab.

---

## Test 6 — Leaving and Deleting Events

**Purpose:** Verify membership management.

1. Log in as `bob` and navigate to the dashboard.
2. Click **Leave** on an event. Confirm `bob` is removed and the event no longer appears on his dashboard.
3. Log in as `alice` (the organiser).
4. On the dashboard, click **Delete** on one of the events she owns.
5. Confirm the event is removed from alice's dashboard and is no longer accessible by its code.

**Edge cases to check:**
- The organiser should **not** see a Leave button (only Delete).
- A non-organiser member should **not** see a Delete button (only Leave).

-----------------------

## Test 7 — Security Checks

**Purpose:** Confirm that protected pages are not accessible without logging in.

1. Log out completely.
2. Try navigating directly to http://localhost:5000/home — you should be redirected to the login page.
3. Try navigating to an event heatmap URL directly (e.g. `/event/1/heatmap`) — you should be redirected to login.
4. Log in as `bob` and try to access an event heatmap for an event `bob` is not a member of — you should be redirected or see an error.
