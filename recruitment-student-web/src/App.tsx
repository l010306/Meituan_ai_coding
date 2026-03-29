import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Discovery from './pages/Discovery';
import Applications from './pages/Applications';
import AIResume from './pages/AIResume';
import MyClubs from './pages/MyClubs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="discovery" />} />
          <Route path="discovery" element={<Discovery />} />
          <Route path="applications" element={<Applications />} />
          <Route path="ai-resume" element={<AIResume />} />
          <Route path="my-clubs" element={<MyClubs />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
