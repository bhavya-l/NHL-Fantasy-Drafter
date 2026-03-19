import { useState } from "react"
import axios from "axios"
import { useFilteredData } from "../Hooks/useFilteredData"

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

interface PlayerSearchProps {
    dreamTeamId: number
    onPlayerAdded: () => void
}

export default function PlayerSearch({ dreamTeamId, onPlayerAdded }: PlayerSearchProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [players, setPlayers] = useState<Player[]>([])
    const {
        filters,
        setFilter,
        clearFilters,
        filteredData
    } = useFilteredData(players)

    const search = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/players/search?q=${query}`)
        setPlayers(res.data)
    }

    const addPlayer = async (playerId: number) => {
        await axios.post(`http://127.0.0.1:5000/dreamteam/${dreamTeamId}/players/${playerId}`)
        onPlayerAdded()
        setOpen(false)
    }

    return (
        <>
            <button onClick={() => { setOpen(true); setQuery(""); search(); clearFilters(); }}>Search for Player</button>

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
                            <h2>Search Players</h2>
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

                        {players.length > 0 && (
                            <table border={1} cellPadding={6} style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Position</th>
                                        <th>Team</th>
                                        <th>Goals</th>
                                        <th>Assists</th>
                                        <th>Points</th>
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
                                                value={filters.position || ""}
                                                onChange={e => setFilter("position", e.target.value)}
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
                                                value={filters.goals || ""}
                                                onChange={e => setFilter("goals", e.target.value)}
                                                placeholder="E.g. >10"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.assists || ""}
                                                onChange={e => setFilter("assists", e.target.value)}
                                                placeholder="E.g. <10"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.points || ""}
                                                onChange={e => setFilter("points", e.target.value)}
                                                placeholder="E.g. >=10"
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={filters.games_played || ""}
                                                onChange={e => setFilter("games_played", e.target.value)}
                                                placeholder="E.g. <=10"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(p => (
                                        <tr key={p.playerid}>
                                            <td>{p.name}</td>
                                            <td>{p.position}</td>
                                            <td>{p.teamname}</td>
                                            <td>{p.goals}</td>
                                            <td>{p.assists}</td>
                                            <td>{p.points}</td>
                                            <td>{p.games_played}</td>
                                            <td><button onClick={() => addPlayer(p.playerid)}>Add</button></td>
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