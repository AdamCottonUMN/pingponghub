import { neon } from '@netlify/neon'

export default async function handler(event, context) {
  try {
    console.log('Fetching users list...');
    const sql = neon()
    // ensure table exists
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
    // fetch all non-sensitive fields
    const users = await sql`
      SELECT username, elo, coins, wins, losses FROM users;
    `
    console.log('Users fetched successfully:', users.length);
    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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
