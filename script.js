
// PingPongHub - Local Storage Implementation
class PingPongHub {
    constructor() {
        this.currentUser = null;
        this.users = this.loadData('users') || [];
        this.matches = this.loadData('matches') || [];
        this.tournaments = this.loadData('tournaments') || [];
        this.init();
    }

    // Data persistence using localStorage (simulating CSV)
    loadData(key) {
        const data = localStorage.getItem(`pingpong_${key}`);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(`pingpong_${key}`, JSON.stringify(data));
    }

    // Initialize the app
    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    checkAuth() {
        const savedUser = this.loadData('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.showMainScreen();
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    }

    showMainScreen() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        this.updateUserInfo();
        this.loadDashboard();
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                this.switchMainTab(e.target);
            }
        });
    }

    // Authentication
    signup() {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (this.users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            username,
            password, // In production, this should be hashed
            elo: 1200,
            coins: 500,
            wins: 0,
            losses: 0,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveData('users', this.users);
        this.showMessage('Account created successfully!', 'success');
        
        // Auto-login after signup
        setTimeout(() => {
            this.currentUser = newUser;
            this.saveData('currentUser', this.currentUser);
            this.showMainScreen();
        }, 1000);
    }

    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.saveData('currentUser', this.currentUser);
            this.showMainScreen();
        } else {
            this.showMessage('Invalid username or password', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('pingpong_currentUser');
        this.showAuthScreen();
        this.clearForms();
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 3000);
    }

    clearForms() {
        document.querySelectorAll('input').forEach(input => input.value = '');
    }

    // Main app functionality
    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Refresh user data
        this.currentUser = this.users.find(u => u.id === this.currentUser.id);
        
        document.getElementById('user-info').textContent = 
            `${this.currentUser.username} | Elo: ${this.currentUser.elo} | Coins: ${this.currentUser.coins}`;
    }

    switchMainTab(tabBtn) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        // Show corresponding content
        const tabName = tabBtn.textContent.toLowerCase();
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'matches':
                this.loadMatches();
                break;
            case 'tournaments':
                this.loadTournaments();
                break;
            case 'leaderboards':
                this.loadLeaderboards();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    loadDashboard() {
        this.loadUserStats();
        this.loadOpponentsList();
        this.loadRecentMatches();
    }

    loadUserStats() {
        const stats = document.getElementById('user-stats');
        const totalMatches = this.currentUser.wins + this.currentUser.losses;
        const winRate = totalMatches > 0 ? ((this.currentUser.wins / totalMatches) * 100).toFixed(1) : 0;
        
        stats.innerHTML = `
            <div><strong>Elo Rating:</strong> ${this.currentUser.elo}</div>
            <div><strong>Coins:</strong> ${this.currentUser.coins}</div>
            <div><strong>Wins:</strong> ${this.currentUser.wins}</div>
            <div><strong>Losses:</strong> ${this.currentUser.losses}</div>
            <div><strong>Win Rate:</strong> ${winRate}%</div>
        `;
    }

    loadOpponentsList() {
        const select = document.getElementById('challenge-opponent');
        select.innerHTML = '<option value="">Select opponent...</option>';
        
        this.users
            .filter(u => u.id !== this.currentUser.id)
            .forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.username} (Elo: ${user.elo})`;
                select.appendChild(option);
            });
    }

    loadRecentMatches() {
        const container = document.getElementById('recent-matches');
        const userMatches = this.matches
            .filter(m => m.player1Id === this.currentUser.id || m.player2Id === this.currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (userMatches.length === 0) {
            container.innerHTML = '<p>No matches yet</p>';
            return;
        }

        container.innerHTML = userMatches.map(match => {
            const opponent = this.users.find(u => 
                u.id === (match.player1Id === this.currentUser.id ? match.player2Id : match.player1Id)
            );
            const isWinner = match.winnerId === this.currentUser.id;
            const status = match.status === 'completed' ? (isWinner ? 'Won' : 'Lost') : 'Pending';
            
            return `
                <div class="match-item ${match.status}">
                    <div>vs ${opponent.username} - ${status}</div>
                    <div class="text-small">Created: ${new Date(match.createdAt).toLocaleDateString()}</div>
                </div>
            `;
        }).join('');
    }

    createChallenge() {
        const opponentId = parseInt(document.getElementById('challenge-opponent').value);
        const coinWager = parseInt(document.getElementById('challenge-coins').value) || 0;

        if (!opponentId) {
            alert('Please select an opponent');
            return;
        }

        if (coinWager > this.currentUser.coins) {
            alert('You don\'t have enough coins for this wager');
            return;
        }

        const opponent = this.users.find(u => u.id === opponentId);
        if (coinWager > opponent.coins) {
            alert('Your opponent doesn\'t have enough coins for this wager');
            return;
        }

        const match = {
            id: Date.now(),
            player1Id: this.currentUser.id,
            player2Id: opponentId,
            coinWager,
            status: 'pending',
            winnerId: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.matches.push(match);
        this.saveData('matches', this.matches);

        alert(`Challenge sent to ${opponent.username}!`);
        document.getElementById('challenge-opponent').value = '';
        document.getElementById('challenge-coins').value = '';
        this.loadRecentMatches();
    }

    loadMatches() {
        this.loadPendingMatches();
        this.loadMatchHistory();
    }

    loadPendingMatches() {
        const container = document.getElementById('pending-matches');
        const pendingMatches = this.matches.filter(m => 
            m.status === 'pending' && 
            (m.player1Id === this.currentUser.id || m.player2Id === this.currentUser.id)
        );

        if (pendingMatches.length === 0) {
            container.innerHTML = '<p>No pending matches</p>';
            return;
        }

        container.innerHTML = pendingMatches.map(match => {
            const opponent = this.users.find(u => 
                u.id === (match.player1Id === this.currentUser.id ? match.player2Id : match.player1Id)
            );
            const isChallenger = match.player1Id === this.currentUser.id;
            
            return `
                <div class="match-item pending">
                    <div><strong>vs ${opponent.username}</strong></div>
                    <div>Coin Wager: ${match.coinWager}</div>
                    <div>Created: ${new Date(match.createdAt).toLocaleDateString()}</div>
                    <div class="match-actions">
                        ${!isChallenger ? `
                            <button class="btn-success" onclick="app.acceptChallenge(${match.id})">Accept</button>
                            <button class="btn-danger" onclick="app.declineChallenge(${match.id})">Decline</button>
                        ` : `<span>Waiting for response...</span>`}
                        ${isChallenger ? `
                            <button class="btn-warning" onclick="app.reportWin(${match.id})">Report Win</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadMatchHistory() {
        const container = document.getElementById('match-history');
        const completedMatches = this.matches
            .filter(m => m.status === 'completed' && 
                (m.player1Id === this.currentUser.id || m.player2Id === this.currentUser.id))
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        if (completedMatches.length === 0) {
            container.innerHTML = '<p>No match history</p>';
            return;
        }

        container.innerHTML = completedMatches.map(match => {
            const opponent = this.users.find(u => 
                u.id === (match.player1Id === this.currentUser.id ? match.player2Id : match.player1Id)
            );
            const isWinner = match.winnerId === this.currentUser.id;
            
            return `
                <div class="match-item completed">
                    <div><strong>vs ${opponent.username}</strong> - ${isWinner ? 'Won' : 'Lost'}</div>
                    <div>Coin Wager: ${match.coinWager}</div>
                    <div>Completed: ${new Date(match.completedAt).toLocaleDateString()}</div>
                </div>
            `;
        }).join('');
    }

    acceptChallenge(matchId) {
        // For demo purposes, immediately start the match
        this.reportWin(matchId);
    }

    declineChallenge(matchId) {
        this.matches = this.matches.filter(m => m.id !== matchId);
        this.saveData('matches', this.matches);
        this.loadPendingMatches();
    }

    reportWin(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        // Simple win reporting - in real app, this would need confirmation
        match.status = 'completed';
        match.winnerId = this.currentUser.id;
        match.completedAt = new Date().toISOString();

        // Update Elo ratings
        this.updateEloRatings(match);

        // Update coin balances
        if (match.coinWager > 0) {
            this.updateCoinBalances(match);
        }

        // Update win/loss records
        this.updateWinLossRecords(match);

        this.saveData('matches', this.matches);
        this.saveData('users', this.users);
        this.updateUserInfo();
        this.loadMatches();
    }

    updateEloRatings(match) {
        const K = 32; // Elo K-factor
        const winner = this.users.find(u => u.id === match.winnerId);
        const loser = this.users.find(u => u.id === (match.winnerId === match.player1Id ? match.player2Id : match.player1Id));

        const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

        const newWinnerElo = Math.round(winner.elo + K * (1 - expectedWinner));
        const newLoserElo = Math.round(loser.elo + K * (0 - expectedLoser));

        winner.elo = newWinnerElo;
        loser.elo = newLoserElo;
    }

    updateCoinBalances(match) {
        const winner = this.users.find(u => u.id === match.winnerId);
        const loser = this.users.find(u => u.id === (match.winnerId === match.player1Id ? match.player2Id : match.player1Id));

        winner.coins += match.coinWager;
        loser.coins -= match.coinWager;
    }

    updateWinLossRecords(match) {
        const winner = this.users.find(u => u.id === match.winnerId);
        const loser = this.users.find(u => u.id === (match.winnerId === match.player1Id ? match.player2Id : match.player1Id));

        winner.wins += 1;
        loser.losses += 1;
    }

    loadLeaderboards() {
        this.showLeaderboard('elo');
    }

    showLeaderboard(type) {
        // Update tab buttons
        document.querySelectorAll('.lb-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.lb-tab:nth-child(${type === 'elo' ? 1 : 2})`).classList.add('active');

        const container = document.getElementById('leaderboard-content');
        const sortedUsers = [...this.users].sort((a, b) => 
            type === 'elo' ? b.elo - a.elo : b.coins - a.coins
        );

        container.innerHTML = `
            <div class="card">
                <h3>${type === 'elo' ? 'Elo Rankings' : 'Coin Rankings'}</h3>
                ${sortedUsers.map((user, index) => `
                    <div class="leaderboard-item">
                        <span class="leaderboard-rank">#${index + 1}</span>
                        <span class="leaderboard-user">${user.username}</span>
                        <span class="leaderboard-score">${type === 'elo' ? user.elo : user.coins}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadTournaments() {
        const container = document.getElementById('tournaments-list');
        
        if (this.tournaments.length === 0) {
            container.innerHTML = '<p>No tournaments available</p>';
            return;
        }

        container.innerHTML = this.tournaments.map(tournament => `
            <div class="match-item">
                <div><strong>${tournament.name}</strong></div>
                <div>Type: ${tournament.type}</div>
                <div>Participants: ${tournament.participants.length}</div>
                <div>Status: ${tournament.status}</div>
                <div class="match-actions">
                    <button class="btn-success" onclick="app.joinTournament(${tournament.id})">Join</button>
                </div>
            </div>
        `).join('');
    }

    createTournament() {
        const name = document.getElementById('tournament-name').value.trim();
        const type = document.getElementById('tournament-type').value;

        if (!name) {
            alert('Please enter a tournament name');
            return;
        }

        const tournament = {
            id: Date.now(),
            name,
            type,
            participants: [this.currentUser.id],
            status: 'open',
            createdBy: this.currentUser.id,
            createdAt: new Date().toISOString()
        };

        this.tournaments.push(tournament);
        this.saveData('tournaments', this.tournaments);

        alert('Tournament created successfully!');
        document.getElementById('tournament-name').value = '';
        this.loadTournaments();
    }

    joinTournament(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        if (tournament.participants.includes(this.currentUser.id)) {
            alert('You are already in this tournament');
            return;
        }

        tournament.participants.push(this.currentUser.id);
        this.saveData('tournaments', this.tournaments);
        
        alert('Joined tournament successfully!');
        this.loadTournaments();
    }

    loadProfile() {
        const container = document.getElementById('profile-info');
        const totalMatches = this.currentUser.wins + this.currentUser.losses;
        const winRate = totalMatches > 0 ? ((this.currentUser.wins / totalMatches) * 100).toFixed(1) : 0;
        
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem;">🏓</div>
                <h2>${this.currentUser.username}</h2>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>Statistics</h4>
                    <p><strong>Elo Rating:</strong> ${this.currentUser.elo}</p>
                    <p><strong>Total Matches:</strong> ${totalMatches}</p>
                    <p><strong>Wins:</strong> ${this.currentUser.wins}</p>
                    <p><strong>Losses:</strong> ${this.currentUser.losses}</p>
                    <p><strong>Win Rate:</strong> ${winRate}%</p>
                </div>
                <div>
                    <h4>Coins & Economy</h4>
                    <p><strong>Current Coins:</strong> ${this.currentUser.coins}</p>
                    <p><strong>Member Since:</strong> ${new Date(this.currentUser.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.getElementById(`${tabName}-form`).classList.add('active');
}

function login() {
    app.login();
}

function signup() {
    app.signup();
}

function logout() {
    app.logout();
}

function showTab(tabName) {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === tabName) {
            btn.classList.add('active');
        }
    });
    app.switchMainTab(document.querySelector('.nav-btn.active'));
}

function createChallenge() {
    app.createChallenge();
}

function createTournament() {
    app.createTournament();
}

function showLeaderboard(type) {
    app.showLeaderboard(type);
}

// Initialize the app
const app = new PingPongHub();
