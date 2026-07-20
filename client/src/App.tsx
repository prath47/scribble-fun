import { Route, Routes } from "react-router-dom"
import { LandingPage } from "@/components/landing/LandingPage"
import { RoomPage } from "@/components/lobby/RoomPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room/:code" element={<RoomPage />} />
    </Routes>
  )
}
