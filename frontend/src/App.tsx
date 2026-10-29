import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import NewAssessment from './pages/NewAssessment'
import AssessmentDetail from './pages/AssessmentDetail'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assessments/new" element={<NewAssessment />} />
            <Route path="/assessments/:id" element={<AssessmentDetail />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
