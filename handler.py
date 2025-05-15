from menu_scrape import fetch_dining_hall_info as get_info
from menu_scrape import currently_serving as get_status
from menu_scrape import currently_serving_dict as get_status_dict
from menu_scrape import get_current_time_est as now
import sqlite3
import json
import os
import logging
import typing_extensions as typing
import hashlib
import math
from datetime import datetime

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger.setLevel(logging.DEBUG)

if not GEMINI_API_KEY:
	logger.error("GEMINI_API_KEY not found in environment variables!!")

this_dir = os.path.dirname(os.path.abspath(__file__))
var_dir = os.path.join(this_dir, 'var')
users_db = os.path.join(var_dir, 'users.db')
data_dir = os.path.join(this_dir, 'data')
output_dir = os.path.join(this_dir, 'output')

if not os.path.exists(var_dir):
	os.makedirs(var_dir)

if not os.path.exists(users_db):
	conn = sqlite3.connect(users_db)
	c = conn.cursor()
	c.execute('''CREATE TABLE users
								(user_id text, password text, preferences json, conversation text)''')
	conn.commit()
	conn.close()

class Handler:
		
	### CLASS VARIABLES ###

	default_preferences = {
		"traits": {
			"vegan": "neutral",
			"vegetarian": "neutral",
			"spicy": "neutral",
			"kosher": "neutral",
			"halal": "neutral",
			"gluten-free": "neutral",
			"nutrient dense low": "neutral",
			"nutrient dense low medium": "neutral",
			"nutrient dense medium": "neutral",
			"nutrient dense medium high": "neutral",
			"nutrient dense high": "neutral"
		},
		"allergens": {
			"beef": False,
			"eggs": False,
			"fish": False,
			"milk": False,
			"oats": False,
			"peanuts": False,
			"pork": False,
			"sesame seed": False,
			"shellfish": False,
			"soy": False,
			"tree nuts": False,
			"wheat/barley/rye": False,
			"item is deep fried": False,
			"alcohol": False
		},
		"custom_preferences": "Insert custom preferences here"
	}

	### HELPER METHODS ##
	def encrypt_password(password):
		"""Encrypt the password using SHA-256."""
		sha_signature = hashlib.sha256(password.encode()).hexdigest()
		return sha_signature

	# returns a dict
	def fetch_database_information(user_id):
		"""Fetch the a user's information from the database."""
		logger.debug(f"Fetching user {user_id} from the database")
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
		user = c.fetchone()
		conn.close()
		if user:
			logger.info(f"User {user_id} found in database")
			preferences = json.loads(user[2])
			conversation = json.loads(user[3])
			password = user[1]
			user_dict = {
				"user_id": user_id,
				"password": password,
				"preferences": preferences,
				"conversation": conversation
			}
			return user_dict
		else:
			logger.info(f"User {user_id} not found in database")
			return None

	
	def check_user_exists(user_id):
		"""Check if a user exists in the database."""
		logger.debug(f"Checking if user {user_id} exists in the database")
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
		user = c.fetchone()
		conn.close()
		if user:
			logger.info(f"User {user_id} found in database")
			return True
		else:
			logger.info(f"User {user_id} not found in database")
			return False
	
	def register_new_user(uniqname, password):
		"""Register a new user in the database."""
		logger.debug(f"register_new_user called with payload: {uniqname}")

		print(f"received username: {uniqname} and password: {password}")

		conn = sqlite3.connect(users_db)
		c = conn.cursor()

		c.execute("SELECT * FROM users WHERE user_id=?", (uniqname,))
		existing_user = c.fetchone()


		if existing_user:
			logger.error(f'Tried to register user that already exists.')
			return False

		preferences_json = json.dumps(Handler.default_preferences)
		convo = json.dumps([])
		encrypted_password = Handler.encrypt_password(password)

		c.execute("INSERT INTO users (user_id, password, preferences, conversation) VALUES (?, ?, ?, ?)", (uniqname, encrypted_password, preferences_json, convo))
		conn.commit()
		conn.close()
		logger.info(f"New user {uniqname} registerered succesfully!")
		return True
	
	def patch_database_information(user_id, key, value):
		"""Update a user's information in the database."""
		logger.debug(f"Updating user {user_id} with key {key} and value {value}")
		if not Handler.check_user_exists(user_id):
			Handler.register_new_user(user_id)
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		try:
			c.execute(f"UPDATE users SET {key} = ? WHERE user_id = ?", (value, user_id))
			conn.commit()
			conn.close()
			return True
		except sqlite3.Error as e:
			logger.error(f"Error updating database: {e}")
			conn.close()
			return False

	def fetch_user_preferences(user_id):
		"""Fetch the user's preferences from the database."""
		logger.debug(f"Fetching preferences for user {user_id}")
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute("SELECT preferences FROM users WHERE user_id = ?", (user_id,))
		result = c.fetchone()
		conn.close()

		if result:
			logger.info(f"User {user_id} found with existing preferences.")
			return json.loads(result[0])
		else:
			logger.info(f"User {user_id} not found in db.")
			return None

	def get_preferences_for_prompt(user_id):
		"""Return the formatted user preferences."""
		logger.debug(f"Getting preferences for user {user_id}")
		preferences = Handler.fetch_user_preferences(user_id)
		if not preferences:
			return None
		
		preferences_str = "\n".join(
			[f"{key.lower()}: {value}" for key, value in preferences["traits"].items()]
		)
		allergens_str = ", ".join(
			[allergen for allergen, value in preferences["allergens"].items() if value]
		)
		foods_str = ", ".join(preferences["foods"])

		return f"User Preferences:\n{preferences_str}\nAllergens: {allergens_str}\nCustom Preferences: {foods_str}"

	# Return formatted preferences for the user
	def get_user_preferences(user_id):
		"""Return the formatted user preferences."""
		logger.debug(f"Getting preferences for user {user_id}")
		preferences = Handler.fetch_user_preferences(user_id)

		if preferences is None:
			return None

		traits_dict = preferences.get("traits", {})
		allergens_dict = preferences.get("allergens", {})
		custom_preferences = preferences.get("foods", "")

		# Create the simplified JSON response
		formatted_preferences = {
			"traits": {trait: value for trait, value in traits_dict.items()},
			"allergens": {allergen: status for allergen, status in allergens_dict.items()},
			"custom_preferences": custom_preferences
		}

		return formatted_preferences

	def clear_db(db):
		"""Clear the database."""
		logger.debug(f"Clearing database {db}")
		if db == 'users':
			try:
				
				conn = sqlite3.connect(users_db)
				c = conn.cursor()
				c.execute(f"DELETE FROM users")
				conn.commit()
				conn.close()
				return True
			except sqlite3.Error as e:
				logger.error(f"Error clearing database: {e}")

		elif db == 'conversations':
			try:
				conn = sqlite3.connect(users_db)
				c = conn.cursor()
				c.execute(f"DELETE FROM conversations")
				conn.commit()
				conn.close()
				return True
			except sqlite3.Error as e:
				logger.error(f"Error clearing database: {e}")

	def save_user_preferences(user_id, prefs_json):
		"""Save the user's preferences to the database."""
		logger.debug(f'Saving preferences for user {user_id}')
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute('SELECT preferences FROM users WHERE user_id = ?', (user_id,))
		
		fetched_pref = c.fetchone()
		if not fetched_pref:
			logger.error(f'User {user_id} does not exist!')
			conn.close()
			return False

		c.execute("UPDATE users SET preferences = ? WHERE user_id = ?", (json.dumps(prefs_json), user_id))
		conn.commit()
		conn.close()
		return True
	
	def get_ai_reccomendations(user_id, date=now().strftime('%Y-%m-%d')): #TODO Provide based on the current mealtime

		dining_halls = [
			'Bursley',
			'East Quad',
			'Markley',
			'Mosher-Jordan',
			'North Quad',
			'South Quad'
		]

		class Recommendations(typing.TypedDict):
			reasoning: str
		
		meal_plan = {}

		prefs = Handler.fetch_user_preferences(user_id)
		
		model = genai.GenerativeModel(model_name="gemini-1.5-flash")
		menu_data = Handler.get_menu()
		menu_data = [hall for hall in menu_data if hall["dining_hall"] in dining_halls]
		gemini_prompt = f'Based on these user preferences and the current serving information: {prefs}\n {get_status()} Generate meal recommendations using the following available meals: {menu_data}. Provide selections of items and their locations and give some reason as well. Just 1 paragraph.'
		result = model.generate_content(
			gemini_prompt,
			generation_config=genai.GenerationConfig(
				response_mime_type="application/json", response_schema=Recommendations,
			),
		)

		return json.loads(result.text)
	

	### MAIN METHODS ###

	def signup(uniqname, password):
		"""
		Register a new user if not found in the database. 
		If the user ID already exists, redirect to login.
		"""
		logger.debug(f"signup called with uniqname: {uniqname}")
		if Handler.check_user_exists(uniqname):
			logger.info(f"User {uniqname} already exists.")
			return False
		else:
			Handler.register_new_user(uniqname, password)
			logger.info(f"New user {uniqname} registered with default preferences.")
			return True
		
	def login(uniqname, password):
		"""
		Log in an existing user. 
		If the user ID is not found, redirect to signup.
		"""
		logger.debug(f"login called with uniqname: {uniqname}")
		
		if not Handler.check_user_exists(uniqname):
			logger.info(f"User {uniqname} not found.")
			return False
		else:
			user_info = Handler.fetch_database_information(uniqname)
			encrypted_password = user_info["password"]
			if Handler.encrypt_password(password) != encrypted_password:
				logger.info(f"User {uniqname} failed to log in.")
				return False
			else:
				logger.info(f"User {uniqname} successfully logged in.")
				return True

	def get_menu():
		"""Return the default current menu for the dining halls."""
		menus = get_info()
		for menu in menus:
			menu["distance"] = None
		return menus
	
	def get_user_menu(user_id, location, date=now().strftime('%Y-%m-%d')):
		
		# Statuses
		statuses = get_status_dict()

		# Dining Hall coordinates

		dining_hall_coords = {
			'Bursley': (42.296152151463275, -83.71031104510504),
			'East Quad': (42.27308724683324, -83.73523173347121),
			'Markley': (42.28105576454475, -83.72888983161529),
			'Mosher-Jordan': (42.28014917899281, -83.73153330135683),
			'North Quad': (42.280668689896245, -83.74012628743262),
			'South Quad': (42.273867238346284, -83.74207111626943)
		}

		# Get the distance between two points
		def get_distance(point1, point2):
			lat1, lon1 = point1
			lat2, lon2 = point2
			R = 6371e3  # Earth's radius in meters
			phi1 = math.radians(lat1)
			phi2 = math.radians(lat2)
			delta_phi = math.radians(lat2 - lat1)
			delta_lambda = math.radians(lon2 - lon1)
			a = math.sin(delta_phi / 2) * math.sin(delta_phi / 2) + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2)
			c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
			distance_meters = R * c
			distance_miles = distance_meters / 1609.34  # Convert meters to miles
			return round(distance_miles, 1)

		# Get the nearest dining distances

		dining_hall_distances = {hall: get_distance(coords, location) for hall, coords in dining_hall_coords.items() if location}

		preferences = Handler.fetch_user_preferences(user_id)
		allergens = []
		if preferences is None:
			return get_info(date)
		else:	
			allergens = [key for key, value in preferences["allergens"].items() if value is True]
			menu_data = get_info(date)
			new_menu_data = []
			for dining_hall in menu_data:
				for meal_time, meals in dining_hall["menus"].items():
					new_meals = []
					for station, items in meals.items():
						new_items = []
						for item in items:
							item_allergens = item["allergens"] # list of allergens
							if not any(allergen in item_allergens for allergen in allergens):
								new_items.append(item)
						new_meals.append({"station_name": station, "items": new_items})
					dining_hall["menus"][meal_time] = new_meals
					if location:
						dining_hall["distance"] = dining_hall_distances[dining_hall["dining_hall"]]
					else:
						dining_hall["distance"] = None
					dining_hall["status"] = statuses[dining_hall["dining_hall"]]
				new_menu_data.append(dining_hall)
			
		if location:
			new_menu_data.sort(key=lambda x: x["distance"])

		return new_menu_data


	def handle_prompt(user_id, message):
		"""Handle the user's prompt."""
		logger.debug(f"Handling prompt for user {user_id}")
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute("SELECT conversation FROM users WHERE user_id = ?", (user_id,))
		result = c.fetchone()

		conversation_history = json.loads(result[0])
		current_messages = conversation_history
		
		prompt = ""

		if len(current_messages) == 0:
			dining_hall_info = Handler.get_user_menu(user_id, None)
			status = get_status()
			logger.info(f"Starting new conversation for user {user_id}")
			context = f"Here are the meals currently being served at the dining halls:\n{dining_hall_info}\n Here is information on if the dining halls are currently open and what meals they are serving:\n{status}"
			prompt = context + "Student prompt: " + message
			current_messages.append({"role": "user", "parts": prompt})
		else:
			prompt = message
			current_messages.append({"role": "user", "parts": message})

		genai.configure(api_key=os.environ["GEMINI_API_KEY"])

		model = genai.GenerativeModel(
				model_name="gemini-1.5-flash",
				system_instruction="Using information about today's menus for the University of Michigan dining halls, answer the student's prompts. Give precise answers, using only 50 words or less. Do not make up information.",
		)

		chat = model.start_chat(
				history = current_messages
		)

		response = chat.send_message(
				prompt,
				generation_config=genai.types.GenerationConfig(
						candidate_count=1,
						max_output_tokens=200,
						temperature=1.0,
				),)
		
		# Update the conversation history
		current_messages.append({"role": "model", "parts": response.text})
		c.execute("UPDATE users SET conversation = ? WHERE user_id = ?", (json.dumps(current_messages), user_id))
		conn.commit()
		conn.close()

		payload = {
				"user_id": user_id,
				"prompt": message,
				"response": (response.text).strip(),
		}

		return payload
	
	def generate_meal_plan(user_id, dining_halls, dates, prompt): 
		"""Generate a meal plan for a user based on dining halls, their preferences, and chosen dates."""
		logger.debug(f"Generating meal plan for user {user_id}")
		class Meal(typing.TypedDict):
			dining_hall: str
			meal_time: str
			meal_station: str
			meal_item_name: str
		
		meal_plan = {}
		
		model = genai.GenerativeModel(model_name="gemini-1.5-flash")
		for date in dates:
			menu_data = Handler.get_menu(user_id, date)
			menu_data = [hall for hall in menu_data if hall["dining_hall"] in dining_halls]
			gemini_prompt = f'Generate a meal plan for {date} using the following available meals: {menu_data} based on the following prompt: {prompt}. Keep in mind this will just be the meals that should be eaten in 1 day.'
			result = model.generate_content(
				gemini_prompt,
				generation_config=genai.GenerationConfig(
					response_mime_type="application/json", response_schema=list[Meal],
				),
			)
			meal_plan[date] = json.loads(result.text)

		return meal_plan
	
	def end_session(user_id):
		"""End the session for a user."""
		logger.debug(f"Ending session for user {user_id}")
		conn = sqlite3.connect(users_db)
		c = conn.cursor()
		c.execute("SELECT conversation FROM users WHERE user_id = ?", (user_id,))
		conversation = c.fetchone()
		c.execute("UPDATE users SET conversation = ? WHERE user_id = ?", (json.dumps([]), user_id))
		conn.commit()
		conn.close()

		prompt = f"Past conversation history: {conversation}\n Current custom preferences are: {Handler.fetch_user_preferences(user_id)['custom_preferences']}"

		genai.configure(api_key=os.environ["GEMINI_API_KEY"])

		model = genai.GenerativeModel(
				model_name="gemini-1.5-flash",
				system_instruction="Given a conversation history, update the user's custom preferences to reflect any preferences in meals they may have reflected in the conversation. For example, 'The user seems to like stir fry'. Keep this summary under 100 words.",
		)

		result = model.generate_content(
			prompt,
			generation_config=genai.types.GenerationConfig(
						candidate_count=1,
						max_output_tokens=200,
						temperature=1.0,
				),
		)

		preferences = Handler.fetch_user_preferences(user_id)
		preferences["custom_preferences"] = result.text
		Handler.save_user_preferences(user_id, preferences)

		return True