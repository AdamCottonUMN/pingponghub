import { neon } from '@netlify/neon'

export default async function handler() {
  const sql = neon()

  const rows = await sql`
    SELECT id, challenger, opponent, datetime, wager, result
    FROM matches
    ORDER BY id DESC;
  `
  return {
    statusCode: 200,
    body: JSON.stringify({ matches: rows })
  }
}
