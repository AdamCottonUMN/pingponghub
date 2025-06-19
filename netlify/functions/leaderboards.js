import { neon } from '@netlify/neon'

export default async function handler() {
  try {
    console.log('Fetching leaderboards data...');
    const sql = neon();

    // Get all users
    const users = await sql`
      SELECT username, elo, coins FROM users;
    `;

    // Sort for leaderboards
    const elo = [...users].sort((a, b) => b.elo - a.elo);
    const coins = [...users].sort((a, b) => b.coins - a.coins);

    console.log('Leaderboards data fetched:', { elo: elo.length, coins: coins.length });
    return new Response(JSON.stringify({ elo, coins }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
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
