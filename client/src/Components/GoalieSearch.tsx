import { useState } from "react"
import axios from "axios"
import { useFilteredData } from "../Hooks/useFilteredData"

interface Goalie {
    playerid: number
    name: string
    position: string
    teamname: string
    goals_against: number
    save_pct: number
    xgoals: number
    games_played: number
}

interface GoalieSearchProps {
    dreamTeamId: number
    onGoalieAdded: () => void
}

export default function GoalieSearch({ dreamTeamId, onGoalieAdded }: GoalieSearchProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [goalies, setGoalies] = useState<Goalie[]>([])
    const {
        filters,
        setFilter,
        clearFilters,
        filteredData
    } = useFilteredData(goalies)

    const search = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/goalies/search?q=${query}`)
        setGoalies(res.data)
    }

    const addGoalie = async (playerId: number) => {
        await axios.post(`http://127.0.0.1:5000/dreamteam/${dreamTeamId}/players/${playerId}`)
        onGoalieAdded()
        setOpen(false)
    }

    return (
        <>
            <button onClick={() => {setOpen(true); setQuery(""); search(); clearFilters()}}>Search for Goalie</button>

            {open && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{ background: "white", padding: "24px", minWidth: "700px", maxHeight: "80vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                            <h2>Search Goalies</h2>
                            <button onClick={() => setOpen(false)}>✕</button>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && search()}
                                placeholder="Search by name..."
                                style={{ flex: 1, padding: "6px" }}
                            />
                            <button onClick={search}>Search</button>
                        </div>

                        {goalies.length > 0 && (
                            <table border={1} cellPadding={6} style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Team</th>
                                        <th>Goals Against</th>
                                        <th>Expected Goals Against</th>
                                        <th>Save Pct</th>
                                        <th>Games Played</th>
                                        <th></th>
                                    </tr>
                                    <tr>
                                        <th>
                                            <input
                                                value={filters.name || ""}
                                                onChange={e => setFilter("name", e.target.value)}
                                                placeholder="Filter..."
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.teamname || ""}
                                                onChange={e => setFilter("teamname", e.target.value)}
                                                placeholder="Filter..."
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.goals_against || ""}
                                                onChange={e => setFilter("goals_against", e.target.value)}
                                                placeholder="E.g. 50"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.xgoals || ""}
                                                onChange={e => setFilter("xgoals", e.target.value)}
                                                placeholder="E.g. >10"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.save_pct || ""}
                                                onChange={e => setFilter("save_pct", e.target.value)}
                                                placeholder="E.g. <10"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.games_played || ""}
                                                onChange={e => setFilter("games_played", e.target.value)}
                                                placeholder="E.g. >=10"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(g => (
                                        <tr key={g.playerid}>
                                            <td>{g.name}</td>
                                            <td>{g.teamname}</td>
                                            <td>{g.goals_against}</td>
                                            <td>{g.xgoals}</td>
                                            <td>{g.save_pct}</td>
                                            <td>{g.games_played}</td>
                                            <td><button onClick={() => addGoalie(g.playerid)}>Add</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}