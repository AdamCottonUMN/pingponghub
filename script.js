// PingPongHub – Netlify Functions / Neon DB Implementation
class PingPongHub {
    constructor() {
      // load persisted session (just username)
      const savedUser = localStorage.getItem('pingpong_currentUser');
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;
      this.users = [];
      this.matches = [];
      this.tournaments = [];
      this.init();
    }
  
    async init() {
      if (this.currentUser) {
        try {
          await this.reloadAllData();
          this.showMainScreen();
        } catch (error) {
          console.error('Error loading data:', error);
          // If there's an error loading data, log the user out
          this.logout();
        }
      } else {
        this.showAuthScreen();
      }
      this.setupEventListeners();
    }
  
    setupEventListeners() {
      document.addEventListener('click', e => {
        if (e.target.classList.contains('nav-btn')) {
          this.switchMainTab(e.target);
        }
      });
    }
  
    // ----------------------------------
    // Screens
    // ----------------------------------
    showAuthScreen() {
      document.getElementById('auth-screen').classList.add('active');
      document.getElementById('main-screen').classList.remove('active');
    }
  
    showMainScreen() {
      document.getElementById('auth-screen').classList.remove('active');
      document.getElementById('main-screen').classList.add('active');
      document.getElementById('user-info').textContent = this.currentUser.username;
      this.loadDashboard();
    }
  
    // ----------------------------------
    // Session / Auth
    // ----------------------------------
    async signup() {
      const u = document.getElementById('signup-username').value.trim();
      const p = document.getElementById('signup-password').value;
      const signupBtn = document.getElementById('signup-button');
      
      if (!u || !p) {
        return this.showMessage('Fill in both fields','error');
      }
      
      try {
        // Show loading state
        signupBtn.disabled = true;
        this.showMessage('Creating account...', 'info');
        
        console.log('Attempting signup for user:', u);
        let res = await fetch('/.netlify/functions/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username:u,password:p}),
        });
        
        console.log('Signup response status:', res.status);
        let data = await res.json();
        console.log('Signup response data:', data);
        
        if (!res.ok) {
          signupBtn.disabled = false;
          console.error('Signup error:', data);
          return this.showMessage(data.error || 'Signup failed', 'error');
        }
        
        if (!data.user) {
          signupBtn.disabled = false;
          console.error('No user data in signup response:', data);
          return this.showMessage('Invalid server response', 'error');
        }
        
        this.currentUser = data.user;
        localStorage.setItem('pingpong_currentUser', JSON.stringify(this.currentUser));
        this.showMessage('Account created! Loading your dashboard...', 'success');
        await this.reloadAllData();
        this.showMainScreen();
      } catch (error) {
        console.error('Signup error:', error);
        this.showMessage('Signup failed', 'error');
        signupBtn.disabled = false;
      }
    }
  
    async login() {
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      const loginBtn = document.getElementById('login-button');
      
      if (!u || !p) {
        return this.showMessage('Fill in both fields','error');
      }
      
      try {
        // Show loading state
        loginBtn.disabled = true;
        this.showMessage('Logging in...', 'info');
        
        console.log('Attempting login for user:', u);
        let res = await fetch('/.netlify/functions/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username: u, password: p}),
        });
        
        console.log('Login response status:', res.status);
        let data = await res.json();
        console.log('Login response data:', data);
        
        if (!res.ok) {
          loginBtn.disabled = false;
          console.error('Login error:', data);
          return this.showMessage(data.error || 'Login failed', 'error');
        }
        
        if (!data.user) {
          loginBtn.disabled = false;
          console.error('No user data in login response:', data);
          return this.showMessage('Invalid server response', 'error');
        }
        
        this.currentUser = data.user;
        localStorage.setItem('pingpong_currentUser', JSON.stringify(this.currentUser));
        this.showMessage('Login successful! Loading your dashboard...', 'success');
        await this.reloadAllData();
        this.showMainScreen();
      } catch (error) {
        console.error('Login error:', error);
        this.showMessage('Login failed', 'error');
        loginBtn.disabled = false;
      }
    }
  
    logout() {
      localStorage.removeItem('pingpong_currentUser');
      this.currentUser = null;
      this.showAuthScreen();
    }
  
    showMessage(text, type) {
      const msg = document.getElementById('auth-message');
      msg.textContent = text;
      msg.className = `message ${type}`;
      // Only auto-clear non-info messages
      if (type !== 'info') {
        setTimeout(() => { 
          // Only clear if it's still showing our message
          if (msg.textContent === text) {
            msg.textContent = '';
            msg.className = 'message';
          }
        }, 3000);
      }
    }
  
    // ----------------------------------
    // Data Loading
    // ----------------------------------
    async reloadAllData() {
      try {
        console.log('Starting to reload all data...');
        
        // users
        console.log('Fetching users...');
        let ures = await fetch('/.netlify/functions/users');
        if (!ures.ok) {
          throw new Error(`Users API error: ${ures.status}`);
        }
        let userData = await ures.json();
        if (!userData.users) {
          throw new Error('Invalid users response format');
        }
        this.users = userData.users;
        console.log('Users loaded:', this.users);
    
        // matches
        console.log('Fetching matches...');
        let mres = await fetch('/.netlify/functions/matches');
        if (!mres.ok) {
          throw new Error(`Matches API error: ${mres.status}`);
        }
        let matchData = await mres.json();
        if (!matchData.matches) {
          throw new Error('Invalid matches response format');
        }
        this.matches = matchData.matches;
        console.log('Matches loaded:', this.matches);
    
        // tournaments (optional)
        try {
          console.log('Fetching tournaments...');
          let tres = await fetch('/.netlify/functions/tournaments');
          if (!tres.ok) {
            console.warn('Tournaments API not available:', tres.status);
            this.tournaments = [];
          } else {
            let tournamentData = await tres.json();
            if (!tournamentData.tournaments) {
              console.warn('Invalid tournaments response format');
              this.tournaments = [];
            } else {
              this.tournaments = tournamentData.tournaments;
              console.log('Tournaments loaded:', this.tournaments);
            }
          }
        } catch (tournamentError) {
          console.warn('Error loading tournaments:', tournamentError);
          this.tournaments = [];
        }
        
        console.log('All data reloaded successfully');
      } catch (error) {
        console.error('Error reloading data:', error);
        this.showMessage('Error loading data: ' + error.message, 'error');
        throw error; // Re-throw to be caught by the calling function
      }
    }
  
    // ----------------------------------
    // UI & Tabs
    // ----------------------------------
    switchMainTab(btn) {
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const name = btn.textContent.toLowerCase();
      document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
      document.getElementById(name).classList.add('active');
      
      // Load tab content
      if (name === 'dashboard') this.loadDashboard();
      if (name === 'matches') this.loadMatches();
      if (name === 'tournaments') this.loadTournaments();
      if (name === 'leaderboards') this.loadLeaderboards();
      if (name === 'profile') this.loadProfile();
    }
  
    // ----------------------------------
    // Dashboard
    // ----------------------------------
    async loadDashboard() {
      this.updateUserStats();
      this.populateOpponents();
      this.renderRecentMatches();
    }
  
    updateUserStats() {
      const me = this.users.find(u=>u.username===this.currentUser.username);
      const stats = document.getElementById('user-stats');
      const total = me.wins+me.losses;
      const rate  = total?((me.wins/total)*100).toFixed(1):0;
      stats.innerHTML = `
        <div><strong>Elo:</strong> ${me.elo}</div>
        <div><strong>Coins:</strong> ${me.coins}</div>
        <div><strong>Wins:</strong> ${me.wins}</div>
        <div><strong>Losses:</strong> ${me.losses}</div>
        <div><strong>Win Rate:</strong> ${rate}%</div>
      `;
    }
  
    populateOpponents() {
      const sel = document.getElementById('challenge-opponent');
      sel.innerHTML = '<option value="">Select opponent…</option>';
      this.users
        .filter(u=>u.username!==this.currentUser.username)
        .forEach(u=>{
          let o = document.createElement('option');
          o.value = u.username;
          o.textContent = `${u.username} (Elo: ${u.elo})`;
          sel.appendChild(o);
        });
    }
  
    renderRecentMatches() {
      const recent = this.matches
        .filter(m=>m.result && (m.challenger===this.currentUser.username||m.opponent===this.currentUser.username))
        .sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt))
        .slice(0,5);
      const ctr = document.getElementById('recent-matches');
      if (!recent.length) return ctr.innerHTML='<p>No matches</p>';
      ctr.innerHTML = recent.map(m=>{
        const opp = m.challenger===this.currentUser.username? m.opponent:m.challenger;
        const youWon = m.result===this.currentUser.username;
        return `<div>${opp} – ${youWon?'Won':'Lost'} @${new Date(m.completedAt).toLocaleDateString()}</div>`;
      }).join('');
    }
  
    // ----------------------------------
    // Challenge / Matches
    // ----------------------------------
    async createChallenge() {
      const opp = document.getElementById('challenge-opponent').value;
      const wag = parseInt(document.getElementById('challenge-coins').value)||0;
      await fetch('/.netlify/functions/challenges', {
        method:'POST',
        body: JSON.stringify({
          challenger: this.currentUser.username,
          opponent:   opp,
          datetime:   new Date().toISOString(),
          wager:      wag
        })
      });
      await this.reloadAllData();
      this.loadDashboard();
    }
  
    async loadMatches() {
      // pending
      const pend = this.matches.filter(m=>!m.result && 
        (m.challenger===this.currentUser.username||m.opponent===this.currentUser.username));
      const pctr = document.getElementById('pending-matches');
      if (!pend.length) pctr.innerHTML='<p>No pending</p>';
      else pctr.innerHTML = pend.map(m=>{
        const opp = m.challenger===this.currentUser.username? m.opponent:m.challenger;
        const youChallenged = m.challenger===this.currentUser.username;
        return `
          <div>
            vs ${opp} (bet ${m.wager})
            ${youChallenged
              ? `<button onclick="app.reportWin(${m.id})">I Won</button>`
              : `<button onclick="app.reportWin(${m.id})">I Won</button>`
            }
          </div>
        `;
      }).join('');
  
      // history
      const comp = this.matches.filter(m=>m.result &&
        (m.challenger===this.currentUser.username||m.opponent===this.currentUser.username));
      const hctr = document.getElementById('match-history');
      if (!comp.length) hctr.innerHTML='<p>No history</p>';
      else hctr.innerHTML = comp.map(m=>{
        const opp = m.challenger===this.currentUser.username? m.opponent:m.challenger;
        const youWon = m.result===this.currentUser.username;
        return `<div>vs ${opp} – ${youWon?'Won':'Lost'}</div>`;
      }).join('');
    }
  
    async reportWin(matchId) {
      await fetch('/.netlify/functions/report', {
        method:'POST',
        body: JSON.stringify({ matchId, winner: this.currentUser.username })
      });
      await this.reloadAllData();
      this.loadMatches();
    }
  
    // ----------------------------------
    // Leaderboards
    // ----------------------------------
    async loadLeaderboards() {
      try {
        const ctr = document.getElementById('leaderboard-content');
        ctr.innerHTML = '<div class="loading">Loading leaderboards...</div>';
        
        console.log('Loading leaderboards...');
        let res = await fetch('/.netlify/functions/leaderboards');
        if (!res.ok) {
          throw new Error(`Leaderboards API error: ${res.status}`);
        }
        
        let data = await res.json();
        console.log('Leaderboards data:', data);
        
        if (!data.elo || !data.coins) {
          throw new Error('Invalid leaderboard data format');
        }

        const formatRank = (list, valueKey) => {
          return list.map((u, i) => `
            <div class="leaderboard-row ${u.username === this.currentUser.username ? 'current-user' : ''}">
              <span class="rank">#${i + 1}</span>
              <span class="username">${u.username}</span>
              <span class="value">${u[valueKey]}</span>
            </div>
          `).join('');
        };

        ctr.innerHTML = `
          <div class="leaderboard-section">
            <h3>Elo Rankings</h3>
            <div class="leaderboard-list">
              ${formatRank(data.elo, 'elo')}
            </div>
          </div>
          <div class="leaderboard-section">
            <h3>Coin Rankings</h3>
            <div class="leaderboard-list">
              ${formatRank(data.coins, 'coins')}
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Error loading leaderboards:', error);
        const ctr = document.getElementById('leaderboard-content');
        ctr.innerHTML = `<div class="error">Error loading leaderboards: ${error.message}</div>`;
      }
    }
  
    // ----------------------------------
    // Tournaments & Profile are similar…
    // ----------------------------------
    loadTournaments() { /* … */ }
    createTournament() { /* … */ }
    joinTournament() { /* … */ }
    loadProfile() { /* … */ }
  }
  
  // hook up globals
  window.app = new PingPongHub();
  function login()   { app.login(); }
  function signup()  { app.signup(); }
  function logout()  { app.logout(); }
  function createChallenge()  { app.createChallenge(); }
  function createTournament() { app.createTournament(); }
  function showLeaderboard()   { app.loadLeaderboards(); }
  
  // Add tab switching functionality
  function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Update form visibility
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
  }
  