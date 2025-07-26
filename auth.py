from flask import Blueprint, request, jsonify, session
from models import User, Database

auth_bp = Blueprint('auth', __name__)
db = Database()
user_model = User(db)

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Basic validation
        if not username or not email or not password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
        
        result = user_model.create_user(username, email, password)
        
        if result['success']:
            return jsonify({
                'success': True, 
                'message': 'User created successfully',
                'user_id': result['user_id']
            }), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        result = user_model.authenticate_user(username, password)
        
        if result['success']:
            # Store user in session
            session['user_id'] = result['user']['id']
            session['username'] = result['user']['username']
            session['logged_in'] = True
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': result['user']
            }), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current logged in user"""
    if 'user_id' in session:
        return jsonify({
            'success': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'logged_in': True
            }
        }), 200
    else:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
