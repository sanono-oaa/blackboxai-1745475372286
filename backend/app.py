import os
import sys

# Add ikabot to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ikabot_path = os.path.join(os.path.dirname(current_dir), 'ikabot-7.1.9')
sys.path.append(ikabot_path)

from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ikabot-secret-key'  # Change this in production
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

from ikabot.web.session import Session
from ikabot.function.autoPirate import autoPirate
from ikabot.function.alertAttacks import alertAttacks

# Store active bot processes
active_processes = {}

@app.route('/<path:path>')
def serve_static(path):
    # Serve index.html for root or dashboard.html for dashboard route
    if path == '' or path == '/':
        return send_from_directory('../frontend', 'index.html')
    if path == 'dashboard.html':
        return send_from_directory('../frontend', 'dashboard.html')
    # Serve static files and assets
    if path.startswith('icons/') or path.startswith('css/') or path.startswith('js/'):
        return send_from_directory('../frontend', path)
    # Fallback to index.html for SPA routing
    return send_from_directory('../frontend', 'index.html')

@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_session' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400
    
    try:
        # Create ikabot session
        ikabot_session = Session()
        if ikabot_session.login(username, password):
            session['user_session'] = username
            return jsonify({'message': 'Login successful'})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/features', methods=['GET'])
@login_required
def get_features():
    features = [
        {
            'id': 'autoPirate',
            'name': 'Auto Pirate',
            'description': 'Automates pirate missions',
            'active': 'autoPirate' in active_processes
        },
        {
            'id': 'alertAttacks',
            'name': 'Alert Attacks',
            'description': 'Monitors and alerts about incoming attacks',
            'active': 'alertAttacks' in active_processes
        }
    ]
    return jsonify(features)

@app.route('/api/feature/<feature_id>/toggle', methods=['POST'])
@login_required
def toggle_feature(feature_id):
    if feature_id not in ['autoPirate', 'alertAttacks']:
        return jsonify({'error': 'Invalid feature'}), 400
    
    try:
        if feature_id in active_processes:
            # Stop feature
            active_processes[feature_id].terminate()
            del active_processes[feature_id]
            return jsonify({'status': 'stopped'})
        else:
            # Start feature
            # TODO: Implement feature start logic with proper parameters
            return jsonify({'status': 'started'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    if 'user_session' not in session:
        return False
    emit('connected', {'data': 'Connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
