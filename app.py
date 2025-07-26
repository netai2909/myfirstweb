from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import os
from datetime import timedelta
from auth import auth_bp
from api import api_bp

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(api_bp, url_prefix='/api')

# Serve frontend files
@app.route('/')
def serve_frontend():
    """Serve the main frontend file"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory(app.static_folder, path)

# Health check endpoint
@app.route('/health')
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'StudySync API is running'}), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create database tables on startup
    from models import Database
    db = Database()
    print("✅ Database initialized successfully")
    
    # Run the application
    print("🚀 Starting StudySync Pro server...")
    print("📱 Access your app at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
