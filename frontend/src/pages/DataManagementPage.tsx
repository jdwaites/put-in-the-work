import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  DeleteSweep as ResetIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const DataManagementPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Admin authentication
  const ADMIN_PIN = '2580'; // PIN for Jamal
  const ADMIN_NAME = 'Jamal';

  const handleAuth = () => {
    if (adminPin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setAuthDialogOpen(false);
      setAuthError('');
    } else {
      setAuthError('Invalid PIN. Access denied.');
      setAdminPin('');
    }
  };

  const handleAuthKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAuth();
    }
  };

  const handleConfirmReset = () => {
    try {
      const confirmed = window.confirm(
        'This will permanently delete ALL fitness data including profiles, workouts, nutrition, sleep, and diary entries. This cannot be undone. Are you sure?'
      );
      
      if (confirmed) {
        const doubleConfirmed = window.confirm(
          'FINAL WARNING: You are about to delete ALL data. This action is irreversible. Continue?'
        );
        
        if (doubleConfirmed) {
          // Clear all data immediately
          localStorage.clear();
          sessionStorage.clear();
          
          // Show success message
          alert('All data has been reset successfully! Redirecting to home...');
          
          // Force redirect to home page to reset everything
          window.location.href = window.location.origin;
        }
      }
      
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Reset confirmation error:', error);
      alert('An error occurred. Please try again.');
      setResetDialogOpen(false);
    }
  };

  // If not authenticated, show authentication dialog
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Dialog 
          open={authDialogOpen} 
          disableEscapeKeyDown
          PaperProps={{
            sx: { minWidth: 400 }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <AdminIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" component="div">
              Admin Access Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Only {ADMIN_NAME} can access data management
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Admin PIN"
              type={showPin ? 'text' : 'password'}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              onKeyPress={handleAuthKeyPress}
              error={!!authError}
              helperText={authError}
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPin(!showPin)}
                      edge="end"
                    >
                      {showPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleAuth}
              startIcon={<LockIcon />}
            >
              Authenticate
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Authenticated admin interface
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Data Management
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Welcome, {ADMIN_NAME}!</strong> You have administrative access to manage all fitness data.
        </Alert>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error">
                  Danger Zone
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                <strong>Reset All Data</strong>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                This will permanently delete all fitness tracking data including:
              </Typography>
              
              <Box component="ul" sx={{ mt: 1, mb: 2 }}>
                <li>All user profiles and profile data</li>
                <li>Workout history and exercise routines</li>
                <li>Nutrition and meal tracking data</li>
                <li>Sleep tracking records</li>
                <li>Performance diary entries</li>
                <li>Goals and preferences</li>
                <li>All app settings and configurations</li>
              </Box>
              
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Warning:</strong> This action cannot be undone. Make sure you have backed up any important data before proceeding.
              </Alert>
            </CardContent>
            
            <CardActions>
              <Button
                variant="contained"
                color="error"
                startIcon={<ResetIcon />}
                onClick={() => setResetDialogOpen(true)}
                size="large"
              >
                Reset All Data
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Additional data management options will be available here in future updates.
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                Refresh Application
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Confirm Data Reset
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>CRITICAL WARNING:</strong> You are about to delete ALL fitness data permanently.
          </Alert>
          
          <Typography variant="body1" paragraph>
            This action will:
          </Typography>
          
          <Box component="ul" sx={{ mb: 2 }}>
            <li>Delete all user profiles</li>
            <li>Remove all workout and exercise data</li>
            <li>Clear nutrition tracking history</li>
            <li>Delete sleep records</li>
            <li>Remove diary entries</li>
            <li>Reset all app preferences</li>
          </Box>
          
          <Typography variant="body2" color="error">
            <strong>This cannot be undone.</strong>
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmReset} 
            color="error" 
            variant="contained"
            startIcon={<ResetIcon />}
          >
            Yes, Reset All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataManagementPage;