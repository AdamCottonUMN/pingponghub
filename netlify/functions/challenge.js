import { neon } from '@netlify/neon'

export default async function handler(event) {
  const sql = neon()
  const { challenger, opponent, datetime, wager } = JSON.parse(event.body)

  // ensure matches table
  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id         SERIAL PRIMARY KEY,
      challenger TEXT,
      opponent   TEXT,
      datetime   TIMESTAMPTZ,
      wager      INTEGER,
      result     TEXT DEFAULT NULL
    );
  `

  // insert match
  await sql`
    INSERT INTO matches (challenger, opponent, datetime, wager)
    VALUES (${challenger}, ${opponent}, ${datetime}, ${wager});
  `
  return { statusCode: 200, body: 'OK' }
}
