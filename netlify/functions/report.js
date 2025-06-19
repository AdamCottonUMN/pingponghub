import { neon } from '@netlify/neon'

export default async function handler(event) {
  const sql = neon()
  const { matchId, winner } = JSON.parse(event.body)

  // 1) load match
  const [match] = await sql`
    SELECT challenger, opponent, wager
    FROM matches
    WHERE id = ${matchId};
  `
  if (!match) {
    return { statusCode: 404, body: 'Match not found' }
  }
  const loser = match.challenger === winner ? match.opponent : match.challenger

  // 2) fetch user stats
  const [winStats] = await sql`
    SELECT elo, coins, wins FROM users WHERE username = ${winner};
  `
  const [loseStats] = await sql`
    SELECT elo, coins, losses FROM users WHERE username = ${loser};
  `

  // 3) compute new Elo
  const updateElo = (rA, rB, scoreA) => {
    const eA = 1 / (1 + 10 ** ((rB - rA) / 400))
    return Math.round(rA + 32 * (scoreA - eA))
  }
  const newEloW = updateElo(winStats.elo, loseStats.elo, 1)
  const newEloL = updateElo(loseStats.elo, winStats.elo, 0)

  // 4) apply updates
  await sql`
    UPDATE users
    SET elo = ${newEloW}, coins = ${winStats.coins + match.wager}, wins = ${winStats.wins + 1}
    WHERE username = ${winner};
  `
  await sql`
    UPDATE users
    SET elo = ${newEloL}, coins = ${loseStats.coins - match.wager}, losses = ${loseStats.losses + 1}
    WHERE username = ${loser};
  `
  await sql`
    UPDATE matches
    SET result = ${winner}
    WHERE id = ${matchId};
  `

  return { statusCode: 200, body: 'OK' }
}
