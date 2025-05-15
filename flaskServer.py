# flaskServer.py
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import logging
import handler
import traceback
from menu_scrape import fetch_dining_hall_info

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = b'\xb8\x08^\x88\tRK\xbd \xc79e\xcd\x91\x07\xda\xc3\x95\xaa\xc1\x01\xd7/&'
CORS(app, supports_credentials=True)
logged_in = False

@app.route('/login/', methods=['POST'])
def login():
    try:
        headers = request.headers
        uniqname = headers.get('uniqname')
        password = headers.get('password')
        if not uniqname or not password:
            return jsonify({"error": "Missing uniqname or password"}), 400
        retVal = handler.Handler.login(uniqname, password)
        if retVal:
            logged_in = True
            session['user'] = "rahul" # HARDCODED
            return jsonify({"message": "User logged in successfully"}), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/signup/', methods=['POST'])
def signup():
    try:
        headers = request.headers
        uniqname = headers.get('uniqname')
        password = headers.get('password')
        if not uniqname or not password:
            return jsonify({"error": "Missing uniqname or password"}), 400
        retVal = handler.Handler.signup(uniqname, password)

        if retVal:
            session['user'] = uniqname
            return jsonify({"message": "User registered successfully"}), 201
        return jsonify({"message": "User already exists"}), 409
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    
#TODO: Please see how the message object is being generated and returned. look at handler.py handle_prompt function.
@app.route('/send_message/', methods=['POST'])
def send_message():
    try:
        session['user'] = "rahul" # HARDCODED
        headers = request.headers
        user = session.get('user')
        if user is None:
            return jsonify({"error": "User not logged in"}), 401
        message = headers.get('message')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400

        response = handler.Handler.handle_prompt(user, message)
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        return jsonify({
            "user_id": user,
            "prompt": message,
            "response": "Error processing message. Please try again later."
        }), 500

#TODO Make sure this is giving the right information. Take a look at handler.py get_user_info function.
@app.route('/getmenu/', methods=['GET'])
def get_menu():
    try:
        session['user'] = "rahul" # HARDCODED
        headers = request.headers
        user = session.get('user')
        if not user:
            logger.info("User not logged in. Sending default dining information")
            return jsonify(handler.Handler.get_menu()), 200
        
        location = headers.get('location')
        print(location)
        coords = (float(location.split(",")[0]), float(location.split(",")[1]))
        menu_data = handler.Handler.get_user_menu(user, coords)
        
        reccomendation = handler.Handler.get_ai_reccomendations(user)
        if not menu_data:
            return jsonify({
                "dining_info": [],
                "payload": "No dining hall information available"
            }), 200
            
        return jsonify({
            "recommendation": reccomendation,
            "dining_info": menu_data,
            "payload": "Success"
        }), 200
            
    except Exception as e:
        logger.error(f"Error in get_menu: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "dining_info": [],
            "error": str(e)
        }), 200

#TODO: Render About Me page using these preferences.
@app.route('/fetch_preferences/', methods=['GET'])
def fetch_user_preferences():
    try:
        session['user'] = "rahul" # HARDCODED
        user_id = session.get('user')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401
        user_prefs = handler.Handler.fetch_user_preferences(user_id)
        if user_prefs is None:
            return jsonify({"error": "User ID not found"}), 404
        return jsonify(user_prefs), 200
    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

#TODO: Make sure this is called when user saves preferences.
@app.route('/save_preferences/', methods=['POST'])
def save_user_preferences():
    try:
        user_id = 'rahul'
        data = request.json
        print(f"received prefs json: {data}")
        retVal = handler.Handler.save_user_preferences(user_id, data)
        
        if retVal is False:
            return jsonify({"message": "Database error. User not found"}), 404
        return jsonify({"message": "Preferences saved successfully"}), 200
    except Exception as e:
        logger.error(f"Error saving preferences: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

#TODO: Add this to the frontend. Can be called when user logs out, or the session ends some other way.
@app.route('/end_session/', methods=['POST'])
def end_session():
    try:
        session['user'] = "rahul" # HARDCODED
        user = session.get('user')
        handler.Handler.end_session(user)
        return jsonify({"message": "Session ended successfully"}), 200
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# returns formatted json of ALL menu options
@app.route('/get_full_menu/', methods=['GET'])
def get_full_menu():
    try:
        formatted_menu = handler.Handler.get_menu()
        print(f"{formatted_menu}")
        return jsonify(formatted_menu), 200
    except Exception as e:
        logger.error(f"Error getting full menu: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)