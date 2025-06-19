import { neon } from '@netlify/neon'

export default async function handler(event) {
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
    console.log('Checking credentials...');
    const sql = neon();
    
    const [user] = await sql`
      SELECT * FROM users
      WHERE username = ${username} AND password = ${password}
    `;

    if (!user) {
      console.log('Invalid credentials for username:', username);
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    console.log('Login successful for user:', username);
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
    console.error('Login error:', error);
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
