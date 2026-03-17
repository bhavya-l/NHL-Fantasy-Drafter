import { useEffect, useState } from "react"
import axios from "axios"

interface ProjectedStats {
    totalgoals: number
    totalassists: number
    totalpoints: number
    totalgamesplayed: number
    avgsavepct: number
}

interface ProjectedStatsProps {
    dreamTeamId: number
    refreshKey: number
}

export default function ProjectedStats({ dreamTeamId, refreshKey }: ProjectedStatsProps) {
    const [stats, setStats] = useState<ProjectedStats | null>(null)

    useEffect(() => {
        fetchStats()
    }, [dreamTeamId, refreshKey])

    const fetchStats = async () => {
        const res = await axios.get(`http://127.0.0.1:5000/dreamteam/${dreamTeamId}/projectedstats`)
        setStats(res.data)
    }

    if (!stats) return <p>Loading projected stats...</p>

    return (
        <div>
            <h2>Projected Team Stats</h2>
            <table border={1} cellPadding={6}>
                <thead>
                    <tr>
                        <th>Total Goals</th>
                        <th>Total Assists</th>
                        <th>Total Points</th>
                        <th>Games Played</th>
                        <th>Avg Save %</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{stats.totalgoals ?? "—"}</td>
                        <td>{stats.totalassists ?? "—"}</td>
                        <td>{stats.totalpoints ?? "—"}</td>
                        <td>{stats.totalgamesplayed ?? "—"}</td>
                        <td>{stats.avgsavepct != null ? Number(stats.avgsavepct).toFixed(4) : "—"}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}