import { neon } from '@netlify/neon'

export default async function handler(event) {
  const sql = neon()
  const { username, password } = JSON.parse(event.body)

  const [user] = await sql`
    SELECT 1 FROM users
    WHERE username = ${username} AND password = ${password}
  `
  if (!user) {
    return { statusCode: 401, body: 'Bad credentials' }
  }
  return { statusCode: 200, body: 'OK' }
}
