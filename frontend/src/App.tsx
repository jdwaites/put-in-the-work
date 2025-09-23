// Profile System Update - Sept 20, 2025
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import Navigation from './components/Navigation';
import ProfileSelector from './components/ProfileSelector';
import ProfileBanner from './components/ProfileBanner';
import HomePage from './pages/HomePage';
import SportsTrainingPage from './pages/SportsTrainingPage';
import WorkoutPlanningPage from './pages/WorkoutPlanningPage';
import AnalyzerPage from './pages/AnalyzerPage';
import ReporterPage from './pages/ReporterPage';
import HealthIntegrationsPage from './pages/HealthIntegrationsPage';
import ExerciseRoutinesPage from './pages/ExerciseRoutinesPage';
import PerformanceDiaryPage from './pages/PerformanceDiaryPage';
import DataExportPage from './pages/DataExportPage';
import DataManagementPage from './pages/DataManagementPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const { currentProfile } = useProfile();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      case 'sports-training':
        return <SportsTrainingPage />;
      case 'workout-planning':
        return <WorkoutPlanningPage />;
      case 'analyzer':
        return <AnalyzerPage />;
      case 'reporter':
        return <ReporterPage />;
      case 'health-integrations':
        return <HealthIntegrationsPage />;
      case 'exercise-routines':
        return <ExerciseRoutinesPage />;
      case 'performance-diary':
        return <PerformanceDiaryPage />;
      case 'data-export':
        return <DataExportPage />;
      case 'data-management':
        return <DataManagementPage />;
      default:
        return <HomePage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: currentProfile.backgroundColor,
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Profile Header */}
      <Box 
        sx={{ 
          p: 2, 
          backgroundColor: 'white',
          borderBottom: `1px solid ${currentProfile.color}30`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ProfileSelector />
        </Box>
      </Box>

      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, pb: 10 }}>
        <ProfileBanner />
        {renderPage()}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ProfileProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </ProfileProvider>
  );
};

export default App;
