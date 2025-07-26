// StudySync Pro - Frontend Application
class StudySyncApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.goals = [];
        this.journalEntries = [];
        this.timer = {
            isRunning: false,
            duration: 25 * 60, // 25 minutes in seconds
            remainingTime: 25 * 60,
            interval: null,
            mode: 'focus'
        };
        
        this.API_BASE = window.location.origin;
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing StudySync Pro...');
        
        // Show loading screen
        this.showLoading();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Check if user is logged in
        await this.checkAuthStatus();
        
        // Hide loading screen
        this.hideLoading();
    }
    
    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading-screen').style.display = 'none';
    }
    
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/auth/me`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentUser = data.user;
                    this.showMainApp();
                    await this.loadUserData();
                } else {
                    this.showAuthModal();
                }
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthModal();
        }
    }
    
    showAuthModal() {
        document.getElementById('auth-modal').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
    
    showMainApp() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('username').textContent = this.currentUser.username;
        }
    }
    
    initEventListeners() {
        // Auth form toggles
        document.getElementById('show-register').addEventListener('click', () => {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            document.getElementById('show-register').style.display = 'none';
            document.getElementById('show-login').style.display = 'block';
            document.getElementById('auth-title').textContent = 'Create Account';
        });
        
        document.getElementById('show-login').addEventListener('click', () => {
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('show-login').style.display = 'none';
            document.getElementById('show-register').style.display = 'block';
            document.getElementById('auth-title').textContent = 'Welcome Back';
        });
        
        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateToSection(item.dataset.section));
        });
        
        // Goals
        document.getElementById('add-goal-btn').addEventListener('click', () => this.showGoalForm());
        document.getElementById('cancel-goal').addEventListener('click', () => this.hideGoalForm());
        document.getElementById('goal-form').addEventListener('submit', (e) => this.handleAddGoal(e));
        
        // Goal filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterGoals(btn.dataset.filter));
        });
        
        // Timer
        document.querySelectorAll('.timer-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTimerMode(btn.dataset.duration));
        });
        
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-timer').addEventListener('click', () => this.resetTimer());
        
        // Journal
        document.getElementById('new-entry-btn').addEventListener('click', () => this.showJournalForm());
        document.getElementById('cancel-entry').addEventListener('click', () => this.hideJournalForm());
        document.getElementById('journal-form').addEventListener('submit', (e) => this.handleAddJournalEntry(e));
        
        // Refresh buttons
        document.getElementById('refresh-dashboard').addEventListener('click', () => this.refreshDashboard());
        document.getElementById('refresh-analytics').addEventListener('click', () => this.refreshAnalytics());
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const loginData = {
            username: document.getElementById('login-username').value.trim(),
            password: document.getElementById('login-password').value
        };
        
        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.showMainApp();
                await this.loadUserData();
                this.showNotification('Login successful! Welcome back.', 'success');
            } else {
                this.showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        const registerData = {
            username,
            email,
            password
        };
        
        try {
            const response = await fetch(`${this.API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(registerData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Account created successfully! Please login.', 'success');
                // Switch to login form
                document.getElementById('show-login').click();
                // Clear form
                document.getElementById('register-form').reset();
            } else {
                this.showNotification(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }
    
    async handleLogout() {
        try {
            await fetch(`${this.API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            this.currentUser = null;
            this.goals = [];
            this.journalEntries = [];
            this.showAuthModal();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        this.currentSection = section;
        
        // Load section-specific data
        if (section === 'analytics') {
            this.refreshAnalytics();
        }
    }
    
    async loadUserData() {
        await Promise.all([
            this.loadGoals(),
            this.loadJournalEntries(),
            this.loadDashboardData()
        ]);
    }
    
    async loadGoals() {
        try {
            const response = await fetch(`${this.API_BASE}/api/goals`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.goals = data.goals;
                    this.renderGoals();
                }
            }
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }
    
    renderGoals(filter = 'all') {
        const container = document.getElementById('goals-list');
        let filteredGoals = this.goals;
        
        if (filter === 'completed') {
            filteredGoals = this.goals.filter(goal => goal.completed);
        } else if (filter === 'pending') {
            filteredGoals = this.goals.filter(goal => !goal.completed);
        }
        
        if (filteredGoals.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-bullseye" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No ${filter === 'all' ? '' : filter} goals yet.</p>
                    ${filter === 'all' ? '<p>Click "Add Goal" to create your first study goal!</p>' : ''}
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredGoals.map(goal => `
            <div class="goal-item ${goal.completed ? 'completed' : ''} priority-${goal.priority}">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${goal.title}</div>
                        <div class="goal-meta">
                            <span><i class="fas fa-tag"></i> ${goal.subject}</span>
                            <span><i class="fas fa-flag"></i> ${goal.priority} priority</span>
                            ${goal.deadline ? `<span><i class="fas fa-calendar"></i> ${new Date(goal.deadline).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="btn ${goal.completed ? 'btn-secondary' : 'btn-success'}" 
                                onclick="app.toggleGoal(${goal.id}, ${!goal.completed})">
                            <i class="fas fa-${goal.completed ? 'undo' : 'check'}"></i>
                            ${goal.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
            </div>
        `).join('');
    }
    
    showGoalForm() {
        document.getElementById('goal-form-container').style.display = 'block';
        document.getElementById('goal-title').focus();
    }
    
    hideGoalForm() {
        document.getElementById('goal-form-container').style.display = 'none';
        document.getElementById('goal-form').reset();
    }
    
    async handleAddGoal(e) {
        e.preventDefault();
        
        const goalData = {
            title: document.getElementById('goal-title').value.trim(),
            description: document.getElementById('goal-description').value.trim(),
            subject: document.getElementById('goal-subject').value,
            priority: document.getElementById('goal-priority').value,
            deadline: document.getElementById('goal-deadline').value || null
        };
        
        try {
            const response = await fetch(`${this.API_BASE}/api/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(goalData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Goal added successfully! 🎯', 'success');
                this.hideGoalForm();
                await this.loadGoals();
                await this.loadDashboardData();
            } else {
                this.showNotification(data.error || 'Failed to add goal', 'error');
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            this.showNotification('Failed to add goal. Please try again.', 'error');
        }
    }
    
    async toggleGoal(goalId, completed) {
        try {
            const response = await fetch(`${this.API_BASE}/api/goals/${goalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ completed })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(completed ? '🎉 Goal completed! Great job!' : 'Goal marked as pending', 'success');
                await this.loadGoals();
                await this.loadDashboardData();
            } else {
                this.showNotification(data.error || 'Failed to update goal', 'error');
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            this.showNotification('Failed to update goal. Please try again.', 'error');
        }
    }
    
    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/api/goals/${goalId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Goal deleted', 'success');
                await this.loadGoals();
                await this.loadDashboardData();
            } else {
                this.showNotification(data.error || 'Failed to delete goal', 'error');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            this.showNotification('Failed to delete goal. Please try again.', 'error');
        }
    }
    
    filterGoals(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderGoals(filter);
    }
    
    // Timer functionality
    setTimerMode(duration) {
        this.timer.duration = duration * 60;
        this.timer.remainingTime = duration * 60;
        
        document.querySelectorAll('.timer-mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-duration="${duration}"]`).classList.add('active');
        
        const modes = {
            25: 'Focus Session',
            5: 'Short Break',
            15: 'Long Break'
        };
        
        document.querySelector('.timer-label').textContent = modes[duration];
        this.updateTimerDisplay();
    }
    
    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            document.getElementById('start-timer').disabled = true;
            document.getElementById('pause-timer').disabled = false;
            
            this.timer.interval = setInterval(() => {
                this.timer.remainingTime--;
                this.updateTimerDisplay();
                
                if (this.timer.remainingTime <= 0) {
                    this.completeTimer();
                }
            }, 1000);
        }
    }
    
    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isRunning = false;
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            
            if (this.timer.interval) {
                clearInterval(this.timer.interval);
                this.timer.interval = null;
            }
        }
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timer.remainingTime = this.timer.duration;
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.remainingTime / 60);
        const seconds = this.timer.remainingTime % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.querySelector('.timer-display').textContent = display;
    }
    
    async completeTimer() {
        this.pauseTimer();
        
        // If this was a focus session, create a study session record
        if (this.timer.duration === 25 * 60) {
            const subject = document.getElementById('timer-subject').value;
            await this.createStudySession(subject, 25);
        }
        
        this.showNotification('⏰ Timer completed! Great work!', 'success');
        this.resetTimer();
    }
    
    async createStudySession(subject, duration) {
        try {
            const sessionData = {
                subject,
                duration,
                notes: '',
                mood: 'good',
                focus_level: 8
            };
            
            await fetch(`${this.API_BASE}/api/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(sessionData)
            });
        } catch (error) {
            console.error('Error creating study session:', error);
        }
    }
    
    // Journal functionality
    showJournalForm() {
        document.getElementById('journal-form-container').style.display = 'block';
        document.getElementById('journal-content').focus();
    }
    
    hideJournalForm() {
        document.getElementById('journal-form-container').style.display = 'none';
        document.getElementById('journal-form').reset();
    }
    
    async handleAddJournalEntry(e) {
        e.preventDefault();
        
        const entryData = {
            content: document.getElementById('journal-content').value.trim(),
            mood: document.getElementById('journal-mood').value,
            tags: []
        };
        
        try {
            const response = await fetch(`${this.API_BASE}/api/journal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(entryData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Journal entry saved! 📝', 'success');
                this.hideJournalForm();
                await this.loadJournalEntries();
            } else {
                this.showNotification(data.error || 'Failed to save journal entry', 'error');
            }
        } catch (error) {
            console.error('Error saving journal entry:', error);
            this.showNotification('Failed to save journal entry. Please try again.', 'error');
        }
    }
    
    async loadJournalEntries() {
        try {
            const response = await fetch(`${this.API_BASE}/api/journal`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.journalEntries = data.entries;
                    this.renderJournalEntries();
                }
            }
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    }
    
    renderJournalEntries() {
        const container = document.getElementById('journal-entries');
        
        if (this.journalEntries.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No journal entries yet.</p>
                    <p>Click "New Entry" to start reflecting on your study journey!</p>
                </div>
            `;
            return;
        }
        
        const moodEmojis = {
            excellent: '😄',
            good: '😊',
            neutral: '😐',
            challenging: '😓',
            difficult: '😞'
        };
        
        container.innerHTML = this.journalEntries.map(entry => `
            <div class="journal-entry">
                <div class="journal-header">
                    <span>${new Date(entry.entry_date).toLocaleDateString()} at ${new Date(entry.created_at).toLocaleTimeString()}</span>
                    <div class="journal-mood">
                        <span>${moodEmojis[entry.mood]}</span>
                        <span>${entry.mood}</span>
                    </div>
                </div>
                <div class="journal-content">${entry.content}</div>
            </div>
        `).join('');
    }
    
    async loadDashboardData() {
        try {
            const response = await fetch(`${this.API_BASE}/api/analytics/dashboard`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateDashboardStats(data.analytics);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    updateDashboardStats(analytics) {
        document.getElementById('total-goals').textContent = analytics.total_goals;
        document.getElementById('completed-goals').textContent = analytics.completed_goals;
        document.getElementById('weekly-hours').textContent = analytics.weekly_hours + 'h';
        document.getElementById('study-streak').textContent = analytics.study_streak;
        
        // Update analytics section
        document.getElementById('completion-rate').textContent = analytics.completion_rate + '%';
        document.getElementById('analytics-weekly-hours').textContent = analytics.weekly_hours + 'h';
    }
    
    async refreshDashboard() {
        await this.loadDashboardData();
        this.showNotification('Dashboard refreshed!', 'success');
    }
    
    async refreshAnalytics() {
        await this.loadDashboardData();
        this.renderSubjectsChart();
        this.showNotification('Analytics refreshed!', 'success');
    }
    
    renderSubjectsChart() {
        const ctx = document.getElementById('subjects-chart');
        if (!ctx) return;
        
        // Sample data - in real implementation, use actual data
        const subjects = ['Mathematics', 'Physics', 'Electronics', 'Python', 'Communication'];
        const data = [4, 3, 2, 1, 2];
        const colors = ['#4a90e2', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6'];
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: subjects,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Initialize the application
const app = new StudySyncApp();

// Make app globally available for inline event handlers
window.app = app;
