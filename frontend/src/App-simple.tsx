import React from 'react';

function App() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1976D2',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>🏋️ Putting in the Work</h1>
      <h2>Fitness Tracking App</h2>
      <p>✅ React Server is Running!</p>
      <p>✅ WSL Ubuntu Environment</p>
      <p>✅ Node.js v18.20.8</p>
      <p>✅ Your app is working!</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '2px solid white', borderRadius: '8px' }}>
        <h3>Next Steps:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>Navigate to Tracker page</li>
          <li>Log your fitness data</li>
          <li>View reports and analytics</li>
          <li>Use workout timers</li>
        </ul>
      </div>
    </div>
  );
}

export default App;