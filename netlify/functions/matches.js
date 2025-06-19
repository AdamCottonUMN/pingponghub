import { neon } from '@netlify/neon'

export default async function handler() {
  try {
    console.log('Fetching matches list...');
    const sql = neon()

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        challenger TEXT REFERENCES users(username),
        opponent TEXT REFERENCES users(username),
        datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        wager INTEGER DEFAULT 0,
        result TEXT DEFAULT 'pending'
      );
    `

    const rows = await sql`
      SELECT id, challenger, opponent, datetime, wager, result
      FROM matches
      ORDER BY id DESC;
    `
    console.log('Matches fetched successfully:', rows.length);
    return new Response(JSON.stringify({ matches: rows }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
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
