import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
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
  Settings as SettingsIcon,
  MoreHoriz as MoreIcon,
} from '@mui/icons-material';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Define primary pages for mobile (most used)
  const primaryPages = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'sports', label: 'Sports', icon: SportsIcon },
    { key: 'analyzer', label: 'Analyzer', icon: AnalyzerIcon },
    { key: 'diary', label: 'Diary', icon: DiaryIcon },
    { key: 'data-management', label: 'Settings', icon: SettingsIcon },
  ];

  // All pages for desktop
  const allPages = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'sports', label: 'Sports', icon: SportsIcon },
    { key: 'analyzer', label: 'Analyzer', icon: AnalyzerIcon },
    { key: 'reporter', label: 'Reporter', icon: ReporterIcon },
    { key: 'health', label: 'Health', icon: HealthIcon },
    { key: 'routines', label: 'Routines', icon: RoutinesIcon },
    { key: 'diary', label: 'Diary', icon: DiaryIcon },
    { key: 'export', label: 'Export', icon: ExportIcon },
    { key: 'data-management', label: 'Settings', icon: SettingsIcon },
  ];

  const pages = isMobile ? primaryPages : allPages;
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
        zIndex: 1000,
        '& .MuiBottomNavigation-root': {
          height: { xs: 60, sm: 64 },
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }
      }} 
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={handleChange}
        showLabels={!isMobile}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: { xs: 40, sm: 80 },
            maxWidth: { xs: 80, sm: 120 },
            padding: { xs: '6px 2px', sm: '6px 12px' },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              fontWeight: 500,
              '&.Mui-selected': {
                fontSize: { xs: '0.65rem', sm: '0.75rem' }
              }
            }
          }
        }}
      >
        {pages.map((page, index) => (
          <BottomNavigationAction
            key={page.key}
            label={isMobile ? undefined : page.label}
            icon={<page.icon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            sx={{
              '&.Mui-selected': {
                color: 'primary.main',
              }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
