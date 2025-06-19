import { neon } from '@netlify/neon'

export default async function handler() {
  try {
    console.log('Fetching tournaments list...');
    const sql = neon()

    // Return empty list for now
    return new Response(JSON.stringify({ tournaments: [] }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error in tournaments endpoint:', error);
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