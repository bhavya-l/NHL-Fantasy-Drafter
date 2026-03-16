import { useState, useEffect } from "react"
import axios from "axios"

interface Player {
  playerid: number
  name: string
  position: string
  teamname: string
  goals: number
  assists: number
  points: number
  games_played: number
}

interface Goalie {
  playerid: number
  name: string
  position: string
  teamname: string
  goals: number
  games_played: number
  xgoals: number
  save_pct: number
}

interface SessionData {
  dreamTeamId: number
  mode: "scratch" | "template"
  teamName?: string
}

interface DreamTeamBuilderProps {
  session: SessionData
}

function slotLabel(current: number, max: number): string {
  return `(${current}/${max})`
}

function slotStyle(current: number, max: number): React.CSSProperties {
  return current > max ? { color: "red" } : {}
}

export default function DreamTeamBuilder({ session }: DreamTeamBuilderProps) {
  const [teamName, setTeamName] = useState("My Dream Team")
  const [editingName, setEditingName] = useState(false)
  const [forwards, setForwards] = useState<Player[]>([])
  const [defensemen, setDefensemen] = useState<Player[]>([])
  const [goalies, setGoalies] = useState<Goalie[]>([])

  useEffect(() => {
    fetchRoster()
  }, [])

  const fetchRoster = async () => {
    const res = await axios.get(`http://127.0.0.1:5000/dreamteam/${session.dreamTeamId}/roster`)
    const skaters: Player[] = res.data.skaters
    const goalieData: Goalie[] = res.data.goalies
    setForwards(skaters.filter(p => p.position !== "D"))
    setDefensemen(skaters.filter(p => p.position === "D"))
    setGoalies(goalieData)
  }

  const handleRenameSave = async () => {
    await axios.put(`http://127.0.0.1:5000/dreamteam/${session.dreamTeamId}`, { dreamTeamName: teamName })
    setEditingName(false)
  }

  const handleRemovePlayer = async (playerId: number) => {
    await axios.delete(`http://127.0.0.1:5000/dreamteam/${session.dreamTeamId}/players/${playerId}`)
    fetchRoster()
  }

  return (
    <div>
      {/* Team name */}
      <div>
        {editingName ? (
          <>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} />
            <button onClick={handleRenameSave}>Save</button>
            <button onClick={() => setEditingName(false)}>Cancel</button>
          </>
        ) : (
          <>
            <h1>{teamName}</h1>
            <button onClick={() => setEditingName(true)}>Rename</button>
          </>
        )}
      </div>

      {/* Forwards */}
      <h2 style={slotStyle(forwards.length, 12)}>
        Forwards {slotLabel(forwards.length, 12)}
        {forwards.length > 12 && " — over limit"}
      </h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Team</th>
            <th>Goals</th>
            <th>Assists</th>
            <th>Points</th>
            <th>GP</th>
          </tr>
        </thead>
        <tbody>
          {forwards.map(p => (
            <tr key={p.playerid}>
              <td>{p.name}</td>
              <td>{p.position}</td>
              <td>{p.teamname}</td>
              <td>{p.goals}</td>
              <td>{p.assists}</td>
              <td>{p.points}</td>
              <td>{p.games_played}</td>
              <td><button onClick={() => handleRemovePlayer(p.playerid)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Defensemen */}
      <h2 style={slotStyle(defensemen.length, 6)}>
        Defensemen {slotLabel(defensemen.length, 6)}
        {defensemen.length > 6 && " — over limit"}
      </h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
            <th>Goals</th>
            <th>Assists</th>
            <th>Points</th>
            <th>GP</th>
          </tr>
        </thead>
        <tbody>
          {defensemen.map(p => (
            <tr key={p.playerid}>
              <td>{p.name}</td>
              <td>{p.teamname}</td>
              <td>{p.goals}</td>
              <td>{p.assists}</td>
              <td>{p.points}</td>
              <td>{p.games_played}</td>
              <td><button onClick={() => handleRemovePlayer(p.playerid)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Goalies */}
      <h2 style={slotStyle(goalies.length, 2)}>
        Goalies {slotLabel(goalies.length, 2)}
        {goalies.length > 2 && " — over limit"}
      </h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
            <th>GP</th>
            <th>Goals Against</th>
            <th>xGoals</th>
            <th>Save %</th>
          </tr>
        </thead>
        <tbody>
          {goalies.map(g => (
            <tr key={g.playerid}>
              <td>{g.name}</td>
              <td>{g.teamname}</td>
              <td>{g.games_played}</td>
              <td>{g.goals}</td>
              <td>{g.xgoals}</td>
              <td>{g.save_pct}</td>
              <td><button onClick={() => handleRemovePlayer(g.playerid)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}