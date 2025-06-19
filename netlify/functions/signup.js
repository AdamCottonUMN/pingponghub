import { neon } from '@netlify/neon'

export default async function handler(event, context) {
  try {
    console.log('Starting signup process...');
    const sql = neon()
    console.log('Database connection initialized');
    
    const { username, password } = JSON.parse(event.body)
    console.log('Parsed request body, username:', username);

    // 1) ensure users table
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
    `
    console.log('Users table ready');

    // 2) check duplicate
    console.log('Checking for existing user...');
    const [exists] = await sql`
      SELECT 1 FROM users WHERE username = ${username}
    `
    if (exists) {
      console.log('Username already exists');
      return new Response(JSON.stringify({ error: 'Username taken' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3) insert new user
    console.log('Creating new user...');
    await sql`
      INSERT INTO users (username, password, elo, coins, wins, losses)
      VALUES (${username}, ${password}, 1000, 500, 0, 0);
    `
    console.log('User created successfully');
    
    return new Response(JSON.stringify({ message: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Signup error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message // Adding error details to help debug
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
