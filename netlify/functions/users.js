import { neon } from '@netlify/neon'

export default async function handler(event, context) {
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
  return {
    statusCode: 200,
    body: JSON.stringify({ users })
  }
}
