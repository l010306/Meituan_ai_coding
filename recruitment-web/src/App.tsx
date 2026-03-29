import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { EmployerPage } from './pages/EmployerPage'
import { DashboardPage } from './pages/DashboardPage'
import { AiCreativePage } from './pages/AiCreativePage'
import { EngineeringPanel } from './pages/EngineeringPanel'
import { LoginPage } from './pages/LoginPage'

function App() {
  const activeClub = localStorage.getItem('active_club');

  return (
    <div className="min-h-screen bg-gray-50/50">
      {activeClub && <Navbar />}
      <main className={`${activeClub ? "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={activeClub ? <Navigate to="/employer" /> : <Navigate to="/login" />} />
          <Route path="/employer" element={activeClub ? <EmployerPage /> : <Navigate to="/login" />} />
          <Route path="/ai-creative" element={activeClub ? <AiCreativePage /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={activeClub ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/engineering" element={activeClub ? <EngineeringPanel /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
