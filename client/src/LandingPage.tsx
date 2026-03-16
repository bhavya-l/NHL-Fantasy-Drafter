import { useState, useEffect } from "react"
import axios from "axios"

interface Team {
  teamname: string
  city: string
}

interface SessionData {
  dreamTeamId: number
  mode: "scratch" | "template"
  teamName?: string
}

interface LandingPageProps {
  onStart: (session: SessionData) => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [showTeamSelect, setShowTeamSelect] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState("")

  useEffect(() => {
    if (showTeamSelect) {
      axios.get("http://127.0.0.1:5000/teams").then(res => setTeams(res.data))
    }
  }, [showTeamSelect])

  const handleScratch = async () => {
    setLoading(true)
    const res = await axios.post("http://127.0.0.1:5000/dreamteam/init")
    onStart({ dreamTeamId: res.data.dreamTeamId, mode: "scratch" })
  }

  const handleLoadTeam = async () => {
    if (!selectedTeam) return
    setLoading(true)
    const res = await axios.post("http://127.0.0.1:5000/dreamteam/init")
    const dreamTeamId = res.data.dreamTeamId
    await axios.post(`http://127.0.0.1:5000/dreamteam/${dreamTeamId}/loadteam/${encodeURIComponent(selectedTeam)}`)
    onStart({ dreamTeamId, mode: "template", teamName: selectedTeam })
  }

  return (
    <div>
      <h1>NHL Dream Team Drafter</h1>
      <p>Build your ultimate roster from any player in the league.</p>

      {!showTeamSelect ? (
        <div>
          <button onClick={handleScratch} disabled={loading}>
            Start from Scratch
          </button>
          <button onClick={() => setShowTeamSelect(true)} disabled={loading}>
            Load an NHL Team
          </button>
        </div>
      ) : (
        <div>
          <label>Select a team:</label>
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
            <option value="">— Choose a team —</option>
            {teams.map(t => (
              <option key={t.teamname} value={t.teamname}>
                {t.teamname} — {t.city}
              </option>
            ))}
          </select>
          <button onClick={() => setShowTeamSelect(false)}>Back</button>
          <button onClick={handleLoadTeam} disabled={!selectedTeam || loading}>
            {loading ? "Loading..." : "Load Roster"}
          </button>
        </div>
      )}
    </div>
  )
}