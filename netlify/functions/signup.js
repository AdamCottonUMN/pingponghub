import { neon } from '@netlify/neon'

export default async function handler(event) {
  console.log('Full event object:', JSON.stringify(event, null, 2));
  try {
    // Parse request body
    let body;
    try {
      // Check if body is a ReadableStream
      if (event.body && typeof event.body.getReader === 'function') {
        const reader = event.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const bodyText = new TextDecoder().decode(Buffer.concat(chunks));
        body = JSON.parse(bodyText);
      } else if (typeof event.body === 'string') {
        body = JSON.parse(event.body);
      } else {
        body = event.body;
      }
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Error parsing body:', e);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        details: e.message
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const { username, password } = body;
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        error: 'Missing credentials',
        details: 'Both username and password are required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Insert new user
    console.log('Creating new user...');
    await sql`
      INSERT INTO users (username, password, elo, coins, wins, losses)
      VALUES (${username}, ${password}, 1000, 500, 0, 0)
    `;
    console.log('User created successfully');

    // Fetch the created user
    const [user] = await sql`
      SELECT username, elo, coins, wins, losses
      FROM users WHERE username = ${username}
    `;
    console.log('Created user data:', user);

    const response = {
      message: 'OK',
      user: {
        username: user.username,
        elo: user.elo,
        coins: user.coins,
        wins: user.wins,
        losses: user.losses
      }
    };
    console.log('Sending response:', response);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}
