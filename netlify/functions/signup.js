import { neon } from '@netlify/neon'

export default async function handler(event, context) {
  try {
    const sql = neon()                           // uses NETLIFY_DATABASE_URL
    const { username, password } = JSON.parse(event.body)

    // 1) ensure users table
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

    // 2) check duplicate
    const [exists] = await sql`
      SELECT 1 FROM users WHERE username = ${username}
    `
    if (exists) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Username taken' })
      }
    }

    // 3) insert new user
    await sql`
      INSERT INTO users (username, password, elo, coins, wins, losses)
      VALUES (${username}, ${password}, 1000, 500, 0, 0);
    `
    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'OK' })
    }
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
