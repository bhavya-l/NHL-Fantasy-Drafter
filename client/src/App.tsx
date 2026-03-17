import { useState } from "react"
import LandingPage from "./Components/LandingPage"
import DreamTeamBuilder from "./Components/DreamTeam"

interface SessionData {
  dreamTeamId: number
  mode: "scratch" | "template"
  teamName?: string
}

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null)

  if (!session) return <LandingPage onStart={setSession} />
  return <DreamTeamBuilder session={session} />
}
