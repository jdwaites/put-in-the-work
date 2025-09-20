import { createTheme } from '@mui/material/styles';

// Duke Blue color palette
const dukeBlue = {
  main: '#003087',      // Primary Duke Blue
  light: '#3366BB',     // Lighter Duke Blue
  dark: '#001F5C',      // Darker Duke Blue
  contrastText: '#FFFFFF'
};

const theme = createTheme({
  palette: {
    primary: {
      main: dukeBlue.main,
      light: dukeBlue.light,
      dark: dukeBlue.dark,
      contrastText: dukeBlue.contrastText,
    },
    secondary: {
      main: '#F5F5F5',    // Light gray
      light: '#FFFFFF',   // White
      dark: '#E0E0E0',    // Darker gray
      contrastText: dukeBlue.main,
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FF9800',
    },
    success: {
      main: '#4CAF50',
    },
    info: {
      main: dukeBlue.light,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: dukeBlue.main,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: dukeBlue.main,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: dukeBlue.main,
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
      color: dukeBlue.main,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      color: dukeBlue.main,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: dukeBlue.main,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 48, 135, 0.2)',
          },
        },
        contained: {
          background: `linear-gradient(45deg, ${dukeBlue.main} 30%, ${dukeBlue.light} 90%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${dukeBlue.dark} 30%, ${dukeBlue.main} 90%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #F0F0F0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: dukeBlue.main,
          boxShadow: '0 2px 8px rgba(0, 48, 135, 0.15)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#666666',
          '&.Mui-selected': {
            color: dukeBlue.main,
          },
        },
      },
    },
  },
});

export default theme;