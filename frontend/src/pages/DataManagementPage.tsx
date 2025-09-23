import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
  Box
} from '@mui/material';
import {
  DeleteSweep as ResetIcon,
  Backup as BackupIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  resetSelectedData, 
  exportDataBeforeReset, 
  downloadBackup, 
  quickResets,
  ResetOptions 
} from '../utils/dataReset';

const DataManagementPage: React.FC = () => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetOptions, setResetOptions] = useState<ResetOptions>({
    profiles: false,
    workouts: false,
    nutrition: false,
    sleep: false,
    diary: false,
    routines: false,
    goals: false,
    preferences: false,
    all: false
  });

  const handleResetOptionChange = (option: keyof ResetOptions) => {
    setResetOptions(prev => ({
      ...prev,
      [option]: !prev[option],
      // If "all" is selected, uncheck others
      ...(option === 'all' && !prev.all ? {
        profiles: false,
        workouts: false,
        nutrition: false,
        sleep: false,
        diary: false,
        routines: false,
        goals: false,
        preferences: false
      } : {}),
      // If any specific option is selected, uncheck "all"
      ...(option !== 'all' ? { all: false } : {})
    }));
  };

  const handleConfirmReset = () => {
    const confirmed = window.confirm(
      `This will permanently delete ${resetOptions.all ? 'ALL' : 'selected'} fitness data. This cannot be undone. Are you sure?`
    );
    
    if (confirmed) {
      resetSelectedData(resetOptions);
      setResetDialogOpen(false);
      alert('Data has been reset successfully! Please refresh the page to start fresh.');
      window.location.reload();
    }
  };

  const getSelectedCount = () => {
    if (resetOptions.all) return 'All Data';
    const selected = Object.entries(resetOptions).filter(([key, value]) => 
      key !== 'all' && value
    ).length;
    return selected === 0 ? 'Nothing Selected' : `${selected} Categories`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your fitness tracking data. You can backup, reset, or selectively clear different types of data.
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BackupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Common data management tasks
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={downloadBackup}
                  fullWidth
                >
                  Download Data Backup
                </Button>
                
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<ResetIcon />}
                  onClick={quickResets.workoutsOnly}
                  fullWidth
                >
                  Reset Workout Data Only
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon />}
                  onClick={quickResets.resetWithBackup}
                  fullWidth
                >
                  Backup & Reset Everything
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Reset */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ResetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Custom Data Reset
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select specific data categories to reset
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<ResetIcon />}
                onClick={() => setResetDialogOpen(true)}
                fullWidth
              >
                Custom Reset Options
              </Button>
              
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label={getSelectedCount()} 
                  color={resetOptions.all ? "error" : "default"}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Categories Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Categories
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Profiles</Typography>
                  <Typography variant="body2" color="text.secondary">
                    User profiles and current profile selection
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Workouts</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exercise history, routines, and training data
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Nutrition</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Meal tracking and dietary information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Sleep</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sleep patterns and quality tracking
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Diary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance diary and mood tracking
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Routines</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custom exercise routines and templates
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Goals</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fitness goals and achievements
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Preferences</Typography>
                  <Typography variant="body2" color="text.secondary">
                    App settings and user preferences
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Reset Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. Consider downloading a backup first.
          </Alert>
          
          <Typography variant="body2" paragraph>
            Select the data categories you want to reset:
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={resetOptions.all}
                onChange={() => handleResetOptionChange('all')}
                color="error"
              />
            }
            label={<Typography fontWeight="bold" color="error">Reset ALL Data</Typography>}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={1}>
            {Object.entries(resetOptions).map(([key, value]) => {
              if (key === 'all') return null;
              return (
                <Grid item xs={6} key={key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={() => handleResetOptionChange(key as keyof ResetOptions)}
                        disabled={resetOptions.all}
                      />
                    }
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                  />
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={downloadBackup} startIcon={<BackupIcon />}>
            Backup First
          </Button>
          <Button 
            onClick={handleConfirmReset} 
            color="error" 
            variant="contained"
            startIcon={<ResetIcon />}
          >
            Reset Selected Data
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataManagementPage;