import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Simple page components
const TrackerPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>📊 Tracker Page</h1>
    <p>Log your weight, sleep, meals, and workouts here!</p>
  </div>
);

const ReporterPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>📈 Reporter Page</h1>
    <p>View your progress charts and analytics here!</p>
  </div>
);

const AnalyzerPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>🤖 Analyzer Page</h1>
    <p>Get AI-powered wellness insights here!</p>
  </div>
);

const TimersPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>⏱️ Timers Page</h1>
    <p>Use HIIT, Pomodoro, and workout timers here!</p>
  </div>
);

// Simple navigation with React Router
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/' && location.pathname === '/tracker');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#003087',
      padding: '10px',
      display: 'flex',
      justifyContent: 'space-around'
    }}>
      <button 
        onClick={() => handleNavigation('/tracker')} 
        style={{ 
          color: isActive('/tracker') || isActive('/') ? '#ffff00' : 'white', 
          textDecoration: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📊 Tracker
      </button>
      <button 
        onClick={() => handleNavigation('/reporter')} 
        style={{ 
          color: isActive('/reporter') ? '#ffff00' : 'white', 
          textDecoration: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📈 Reporter
      </button>
      <button 
        onClick={() => handleNavigation('/analyzer')} 
        style={{ 
          color: isActive('/analyzer') ? '#ffff00' : 'white', 
          textDecoration: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        🤖 Analyzer
      </button>
      <button 
        onClick={() => handleNavigation('/timers')} 
        style={{ 
          color: isActive('/timers') ? '#ffff00' : 'white', 
          textDecoration: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ⏱️ Timers
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingBottom: '80px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#003087',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1>🏋️ Putting in the Work</h1>
          <p>Your Comprehensive Fitness Tracking App</p>
        </div>
        
        <Routes>
          <Route path="/" element={<TrackerPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/reporter" element={<ReporterPage />} />
          <Route path="/analyzer" element={<AnalyzerPage />} />
          <Route path="/timers" element={<TimersPage />} />
        </Routes>
        
        <Navigation />
      </div>
    </Router>
  );
}

export default App;