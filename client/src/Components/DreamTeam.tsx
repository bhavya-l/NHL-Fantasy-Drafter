import { useState, useEffect } from "react"
import axios from "axios"
import PlayerSearch from "./PlayerSearch"
import GoalieSearch from "./GoalieSearch"
import ProjectedStats from "./ProjectedStats"

type SortConfig = {
    key: string
    direction: "asc" | "desc"
} | null

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
    goals_against: number
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
    const [refreshKey, setRefreshKey] = useState(0)
    const [forwardSort, setForwardSort] = useState<SortConfig>(null)
    const [defenseSort, setDefenseSort] = useState<SortConfig>(null)
    const [goalieSort, setGoalieSort] = useState<SortConfig>(null)

    useEffect(() => {
        fetchRoster()
    }, [])

    const fetchRoster = async () => {
        setRefreshKey(k => k + 1)
        const res = await axios.get(`http://127.0.0.1:5000/dreamteam/${session.dreamTeamId}/roster`)
        const skaters: Player[] = res.data.skaters
        const goalieData: Goalie[] = res.data.goalies
        setForwards(skaters.filter(p => p.position !== "D"))
        setDefensemen(skaters.filter(p => p.position === "D"))
        setGoalies(goalieData)
    }

    function getArrow(sort: SortConfig, key: string) {
        if (!sort || sort.key !== key) return ""
        return sort.direction === "asc" ? " ↑" : " ↓"
    }

    function sortData<T>(data: T[], sortConfig: SortConfig): T[] {
        if (!sortConfig) return data

        const { key, direction } = sortConfig

        return [...data].sort((a: any, b: any) => {
            const aVal = a[key]
            const bVal = b[key]

            if (typeof aVal === "string") {
                return direction === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            return direction === "asc" ? aVal - bVal : bVal - aVal
        })
    }

    function handleSort(
        key: string,
        setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>
    ) {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return {
                    key,
                    direction: prev.direction === "asc" ? "desc" : "asc"
                }
            }
            return { key, direction: "asc" }
        })
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
            <PlayerSearch dreamTeamId={session.dreamTeamId} onPlayerAdded={fetchRoster} />
            <GoalieSearch dreamTeamId={session.dreamTeamId} onGoalieAdded={fetchRoster} />
            <ProjectedStats dreamTeamId={session.dreamTeamId} refreshKey={refreshKey} />

            {/* Forwards */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                <div>
                    <h2 style={slotStyle(forwards.length, 12)}>
                        Forwards {slotLabel(forwards.length, 12)}
                        {forwards.length > 12 && " — over limit"}
                    </h2>
                    <table border={1} cellPadding={6}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("name", setForwardSort)}>Name {getArrow(forwardSort, "name")}</th>
                                <th onClick={() => handleSort("position", setForwardSort)}>Position {getArrow(forwardSort, "position")}</th>
                                <th onClick={() => handleSort("teamname", setForwardSort)}>Team {getArrow(forwardSort, "teamname")}</th>
                                <th onClick={() => handleSort("goals", setForwardSort)}>Goals {getArrow(forwardSort, "goals")}</th>
                                <th onClick={() => handleSort("assists", setForwardSort)}>Assists {getArrow(forwardSort, "assists")}</th>
                                <th onClick={() => handleSort("points", setForwardSort)}>Points {getArrow(forwardSort, "points")}</th>
                                <th onClick={() => handleSort("games_played", setForwardSort)}>Games Played {getArrow(forwardSort, "games_played")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortData(forwards, forwardSort).map(p => (
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
                </div>
                {/* Defensemen */}
                <div>
                    <h2 style={slotStyle(defensemen.length, 6)}>
                        Defensemen {slotLabel(defensemen.length, 6)}
                        {defensemen.length > 6 && " — over limit"}
                    </h2>
                    <table border={1} cellPadding={6}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("name", setDefenseSort)}>Name {getArrow(defenseSort, "name")}</th>
                                <th onClick={() => handleSort("teamname", setDefenseSort)}>Team {getArrow(defenseSort, "teamname")}</th>
                                <th onClick={() => handleSort("goals", setDefenseSort)}>Goals {getArrow(defenseSort, "goals")}</th>
                                <th onClick={() => handleSort("assists", setDefenseSort)}>Assists {getArrow(defenseSort, "assists")}</th>
                                <th onClick={() => handleSort("points", setDefenseSort)}>Points {getArrow(defenseSort, "points")}</th>
                                <th onClick={() => handleSort("games_played", setDefenseSort)}>Games Played {getArrow(defenseSort, "games_played")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortData(defensemen, defenseSort).map(p => (
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
                </div>
            </div>
            {/* Goalies */}
            <h2 style={slotStyle(goalies.length, 2)}>
                Goalies {slotLabel(goalies.length, 2)}
                {goalies.length > 2 && " — over limit"}
            </h2>
            <table border={1} cellPadding={6}>
                <thead>
                    <tr>
                        <th onClick={() => handleSort("name", setGoalieSort)}>Name {getArrow(goalieSort, "name")}</th>
                        <th onClick={() => handleSort("teamname", setGoalieSort)}>Team {getArrow(goalieSort, "teamname")}</th>
                        <th onClick={() => handleSort("games_played", setGoalieSort)}>Games Played {getArrow(goalieSort, "games_played")}</th>
                        <th onClick={() => handleSort("goals_against", setGoalieSort)}>Goals Against {getArrow(goalieSort, "goals_against")}</th>
                        <th onClick={() => handleSort("xgoals", setGoalieSort)}>Expected Goals Against {getArrow(goalieSort, "xgoals")}</th>
                        <th onClick={() => handleSort("save_pct", setGoalieSort)}>Save % {getArrow(goalieSort, "save_pct")}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortData(goalies, goalieSort).map(g => (
                        <tr key={g.playerid}>
                            <td>{g.name}</td>
                            <td>{g.teamname}</td>
                            <td>{g.games_played}</td>
                            <td>{g.goals_against}</td>
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