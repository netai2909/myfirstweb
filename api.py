from flask import Blueprint, request, jsonify, session
from models import Database
import sqlite3
from datetime import datetime, date, timedelta
import json

api_bp = Blueprint('api', __name__)
db = Database()

def login_required(f):
    """Decorator to require login for API endpoints"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Login required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Goals API
@api_bp.route('/goals', methods=['GET'])
@login_required
def get_goals():
    """Get user's goals"""
    try:
        user_id = session['user_id']
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM goals 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        
        goals = []
        for row in cursor.fetchall():
            goals.append({
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'subject': row['subject'],
                'priority': row['priority'],
                'deadline': row['deadline'],
                'completed': bool(row['completed']),
                'created_at': row['created_at'],
                'completed_at': row['completed_at']
            })
        
        conn.close()
        return jsonify({'success': True, 'goals': goals}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/goals', methods=['POST'])
@login_required
def create_goal():
    """Create new goal"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        subject = data.get('subject', 'general').strip()
        priority = data.get('priority', 'medium').strip()
        deadline = data.get('deadline')
        
        if not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO goals (user_id, title, description, subject, priority, deadline)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, title, description, subject, priority, deadline))
        
        goal_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Goal created successfully',
            'goal_id': goal_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@login_required
def update_goal(goal_id):
    """Update goal (mark complete/incomplete)"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        completed = data.get('completed', False)
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        completed_at = datetime.now().isoformat() if completed else None
        
        cursor.execute('''
            UPDATE goals 
            SET completed = ?, completed_at = ?
            WHERE id = ? AND user_id = ?
        ''', (completed, completed_at, goal_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Goal not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Goal updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    """Delete goal"""
    try:
        user_id = session['user_id']
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Goal not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Goal deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Study Sessions API
@api_bp.route('/sessions', methods=['POST'])
@login_required
def create_session():
    """Create study session"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        subject = data.get('subject', '').strip()
        duration = data.get('duration', 0)
        notes = data.get('notes', '').strip()
        mood = data.get('mood', 'neutral').strip()
        focus_level = data.get('focus_level', 5)
        
        if not subject or duration <= 0:
            return jsonify({'success': False, 'error': 'Subject and duration required'}), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        session_date = date.today().isoformat()
        
        cursor.execute('''
            INSERT INTO study_sessions 
            (user_id, subject, duration, notes, mood, focus_level, session_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, subject, duration, notes, mood, focus_level, session_date))
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Study session created',
            'session_id': session_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Journal API
@api_bp.route('/journal', methods=['GET'])
@login_required
def get_journal_entries():
    """Get user's journal entries"""
    try:
        user_id = session['user_id']
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM journal_entries 
            WHERE user_id = ? 
            ORDER BY entry_date DESC, created_at DESC
            LIMIT 20
        ''', (user_id,))
        
        entries = []
        for row in cursor.fetchall():
            entries.append({
                'id': row['id'],
                'content': row['content'],
                'mood': row['mood'],
                'tags': json.loads(row['tags']) if row['tags'] else [],
                'entry_date': row['entry_date'],
                'created_at': row['created_at']
            })
        
        conn.close()
        return jsonify({'success': True, 'entries': entries}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/journal', methods=['POST'])
@login_required
def create_journal_entry():
    """Create journal entry"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        content = data.get('content', '').strip()
        mood = data.get('mood', 'neutral').strip()
        tags = data.get('tags', [])
        
        if not content:
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        entry_date = date.today().isoformat()
        tags_json = json.dumps(tags)
        
        cursor.execute('''
            INSERT INTO journal_entries (user_id, content, mood, tags, entry_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, content, mood, tags_json, entry_date))
        
        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Journal entry created',
            'entry_id': entry_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Analytics API
@api_bp.route('/analytics/dashboard', methods=['GET'])
@login_required
def get_dashboard_analytics():
    """Get dashboard analytics data"""
    try:
        user_id = session['user_id']
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get goals stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_goals,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_goals
            FROM goals WHERE user_id = ?
        ''', (user_id,))
        goals_stats = cursor.fetchone()
        
        # Get study time this week
        week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
        cursor.execute('''
            SELECT COALESCE(SUM(duration), 0) as weekly_hours
            FROM study_sessions 
            WHERE user_id = ? AND session_date >= ?
        ''', (user_id, week_start))
        weekly_hours = cursor.fetchone()['weekly_hours']
        
        # Get study streak (simplified)
        cursor.execute('''
            SELECT COUNT(DISTINCT session_date) as study_days
            FROM study_sessions 
            WHERE user_id = ? AND session_date >= ?
        ''', (user_id, week_start))
        study_days = cursor.fetchone()['study_days']
        
        # Get subject breakdown
        cursor.execute('''
            SELECT subject, SUM(duration) as total_time, COUNT(*) as session_count
            FROM study_sessions 
            WHERE user_id = ? AND session_date >= ?
            GROUP BY subject
            ORDER BY total_time DESC
        ''', (user_id, week_start))
        subjects = []
        for row in cursor.fetchall():
            subjects.append({
                'subject': row['subject'],
                'total_time': row['total_time'],
                'session_count': row['session_count']
            })
        
        conn.close()
        
        completion_rate = 0
        if goals_stats['total_goals'] > 0:
            completion_rate = (goals_stats['completed_goals'] / goals_stats['total_goals']) * 100
        
        analytics = {
            'total_goals': goals_stats['total_goals'],
            'completed_goals': goals_stats['completed_goals'],
            'completion_rate': round(completion_rate, 1),
            'weekly_hours': round(weekly_hours / 60, 1),  # Convert to hours
            'study_streak': study_days,
            'subjects': subjects
        }
        
        return jsonify({'success': True, 'analytics': analytics}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
