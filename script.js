// PingPongHub – Netlify Functions / Neon DB Implementation
class PingPongHub {
    constructor() {
      // load persisted session (just username)
      this.currentUser = JSON.parse(localStorage.getItem('pingpong_currentUser'));
      this.users = [];
      this.matches = [];
      this.tournaments = [];
      this.init();
    }
  
    async init() {
      if (this.currentUser) {
        await this.reloadAllData();
        this.showMainScreen();
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
      // users
      let ures = await fetch('/.netlify/functions/users');
      this.users = (await ures.json()).users;
  
      // matches
      let mres = await fetch('/.netlify/functions/matches');
      this.matches = (await mres.json()).matches;
  
      // tournaments (if you have that function)
      let tres = await fetch('/.netlify/functions/tournaments');
      this.tournaments = (await tres.json()).tournaments;
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
      if (name==='dashboard') this.loadDashboard();
      if (name==='matches')    this.loadMatches();
      if (name==='tournaments')this.loadTournaments();
      if (name==='leaderboards')this.loadLeaderboards();
      if (name==='profile')    this.loadProfile();
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
      let res = await fetch('/.netlify/functions/leaderboards');
      let { elo, coins } = await res.json();
      const ctr = document.getElementById('leaderboard-content');
      ctr.innerHTML = `
        <h3>Elo</h3>
        ${elo.map(u=>`<div>${u.username}: ${u.elo}</div>`).join('')}
        <h3>Coins</h3>
        ${coins.map(u=>`<div>${u.username}: ${u.coins}</div>`).join('')}
      `;
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
  