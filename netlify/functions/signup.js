import { neon } from '@netlify/neon'

export default async function handler(event) {
  console.log('Full event object:', JSON.stringify(event, null, 2));
  try {
    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : event;
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing body:', e);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        details: 'Request body must be valid JSON'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { username, password } = body;
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        error: 'Missing credentials',
        details: 'Both username and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize database connection
    console.log('Initializing database connection...');
    const sql = neon();
    
    // Create users table if it doesn't exist
    console.log('Creating users table if not exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT,
        elo      INTEGER,
        coins    INTEGER,
        wins     INTEGER,
        losses   INTEGER
      );
    `;

    // Check for existing user
    console.log('Checking for existing user...');
    const [exists] = await sql`
      SELECT 1 FROM users WHERE username = ${username}
    `;

    if (exists) {
      console.log('Username already exists');
      return new Response(JSON.stringify({ error: 'Username taken' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new user
    console.log('Creating new user...');
    await sql`
      INSERT INTO users (username, password, elo, coins, wins, losses)
      VALUES (${username}, ${password}, 1000, 500, 0, 0)
    `;
    console.log('User created successfully');

    return new Response(JSON.stringify({ message: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Signup error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
