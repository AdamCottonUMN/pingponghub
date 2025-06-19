import { neon } from '@netlify/neon'

export default async function handler() {
  const sql = neon()

  const eloList = await sql`
    SELECT username, elo
    FROM users
    ORDER BY elo DESC
    LIMIT 10;
  `
  const coinList = await sql`
    SELECT username, coins
    FROM users
    ORDER BY coins DESC
    LIMIT 10;
  `
  return {
    statusCode: 200,
    body: JSON.stringify({ elo: eloList, coins: coinList })
  }
}
