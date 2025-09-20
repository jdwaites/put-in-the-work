import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  Sports as SportsIcon,
  Analytics as AnalyzerIcon,
  Assessment as ReporterIcon,
  Healing as HealthIcon,
  EventNote as RoutinesIcon,
  BookOnline as DiaryIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const pages = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'sports', label: 'Sports', icon: SportsIcon },
    { key: 'analyzer', label: 'Analyzer', icon: AnalyzerIcon },
    { key: 'reporter', label: 'Reporter', icon: ReporterIcon },
    { key: 'health', label: 'Health', icon: HealthIcon },
    { key: 'routines', label: 'Routines', icon: RoutinesIcon },
    { key: 'diary', label: 'Diary', icon: DiaryIcon },
    { key: 'export', label: 'Export', icon: ExportIcon },
  ];

  const currentIndex = pages.findIndex(page => page.key === currentPage);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedPage = pages[newValue];
    if (selectedPage) {
      onPageChange(selectedPage.key);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={handleChange}
        showLabels
      >
        {pages.map((page, index) => (
          <BottomNavigationAction
            key={page.key}
            label={page.label}
            icon={<page.icon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
