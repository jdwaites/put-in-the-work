import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  CloudSync as SyncIcon,
  CheckCircle as ConnectedIcon,
  Cancel as DisconnectedIcon,
  Sync as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { healthIntegrationService } from '../utils/healthIntegration';

interface ConnectionStatus {
  googleFit: {
    connected: boolean;
    lastSync: string | null;
    permissions: string[];
  };
  samsungHealth: {
    connected: boolean;
    lastSync: string | null;
    permissions: string[];
  };
}

interface SyncStats {
  googleFit: {
    weight: number;
    sleep: number;
  };
  samsungHealth: {
    weight: number;
    sleep: number;
  };
  total: {
    weight: number;
    sleep: number;
  };
}

const HealthIntegrationsPage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    googleFit: { connected: false, lastSync: null, permissions: [] },
    samsungHealth: { connected: false, lastSync: null, permissions: [] }
  });
  const [syncStats, setSyncStats] = useState<SyncStats>({
    googleFit: { weight: 0, sleep: 0 },
    samsungHealth: { weight: 0, sleep: 0 },
    total: { weight: 0, sleep: 0 }
  });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setConnectionStatus(healthIntegrationService.getConnectionStatus());
    setSyncStats(healthIntegrationService.getSyncStats());
  };

  const handleConnect = async (service: 'googleFit' | 'samsungHealth') => {
    setLoading({ ...loading, [service]: true });
    
    try {
      let success = false;
      
      if (service === 'googleFit') {
        success = await healthIntegrationService.connectGoogleFit();
      } else {
        success = await healthIntegrationService.connectSamsungHealth();
      }
      
      if (success) {
        setSnackbar({
          open: true,
          message: `Successfully connected to ${service === 'googleFit' ? 'Google Fit' : 'Samsung Health'}!`,
          severity: 'success'
        });
        loadData();
      } else {
        setSnackbar({
          open: true,
          message: `Failed to connect to ${service === 'googleFit' ? 'Google Fit' : 'Samsung Health'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Connection error: ${error}`,
        severity: 'error'
      });
    } finally {
      setLoading({ ...loading, [service]: false });
    }
  };

  const handleDisconnect = async (service: 'googleFit' | 'samsungHealth') => {
    try {
      if (service === 'googleFit') {
        await healthIntegrationService.disconnectGoogleFit();
      } else {
        await healthIntegrationService.disconnectSamsungHealth();
      }
      
      setSnackbar({
        open: true,
        message: `Disconnected from ${service === 'googleFit' ? 'Google Fit' : 'Samsung Health'}`,
        severity: 'success'
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Disconnect error: ${error}`,
        severity: 'error'
      });
    }
  };

  const handleSync = async () => {
    setLoading({ ...loading, sync: true });
    
    try {
      const success = await healthIntegrationService.syncData();
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Data synchronized successfully!',
          severity: 'success'
        });
        loadData();
      } else {
        setSnackbar({
          open: true,
          message: 'No connected services to sync',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Sync error: ${error}`,
        severity: 'error'
      });
    } finally {
      setLoading({ ...loading, sync: false });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health App Integrations
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Feature Not Yet Implemented:</strong> Health app integrations are not currently functional. 
          This interface is for demonstration purposes. Manual data entry through Sports Training is currently available.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Google Fit Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <img 
                  src="https://developers.google.com/fit/images/fit_logo_lockup.png" 
                  alt="Google Fit" 
                  style={{ height: 24, marginRight: 8 }}
                />
                <Typography variant="h6">Google Fit</Typography>
                <Box ml="auto">
                  {connectionStatus.googleFit.connected ? (
                    <Chip 
                      icon={<ConnectedIcon />} 
                      label="Connected" 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      icon={<DisconnectedIcon />} 
                      label="Disconnected" 
                      color="default" 
                      size="small" 
                    />
                  )}
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Sync weight, sleep, and activity data from Google Fit to your fitness dashboard.
              </Typography>

              {connectionStatus.googleFit.connected && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Last Sync:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(connectionStatus.googleFit.lastSync)}
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Permissions:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {connectionStatus.googleFit.permissions.map((permission) => (
                      <Chip key={permission} label={permission} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Synced Data:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weight: {syncStats.googleFit.weight} entries, Sleep: {syncStats.googleFit.sleep} entries
                  </Typography>
                </Box>
              )}

              <Box display="flex" gap={1}>
                {connectionStatus.googleFit.connected ? (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => handleDisconnect('googleFit')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={() => handleConnect('googleFit')}
                    disabled={loading.googleFit}
                    startIcon={loading.googleFit ? <CircularProgress size={16} /> : null}
                  >
                    {loading.googleFit ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Samsung Health Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: '#1f7dcc', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}
                >
                  <Typography variant="caption" color="white" fontWeight="bold">
                    S
                  </Typography>
                </Box>
                <Typography variant="h6">Samsung Health</Typography>
                <Box ml="auto">
                  {connectionStatus.samsungHealth.connected ? (
                    <Chip 
                      icon={<ConnectedIcon />} 
                      label="Connected" 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      icon={<DisconnectedIcon />} 
                      label="Disconnected" 
                      color="default" 
                      size="small" 
                    />
                  )}
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Import health and fitness data from Samsung Health including weight, sleep, and exercise data.
              </Typography>

              {connectionStatus.samsungHealth.connected && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Last Sync:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(connectionStatus.samsungHealth.lastSync)}
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Permissions:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {connectionStatus.samsungHealth.permissions.map((permission) => (
                      <Chip key={permission} label={permission} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Synced Data:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weight: {syncStats.samsungHealth.weight} entries, Sleep: {syncStats.samsungHealth.sleep} entries
                  </Typography>
                </Box>
              )}

              <Box display="flex" gap={1}>
                {connectionStatus.samsungHealth.connected ? (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => handleDisconnect('samsungHealth')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={() => handleConnect('samsungHealth')}
                    disabled={loading.samsungHealth}
                    startIcon={loading.samsungHealth ? <CircularProgress size={16} /> : null}
                  >
                    {loading.samsungHealth ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sync Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="h6">Data Synchronization</Typography>
                <Button
                  variant="contained"
                  startIcon={loading.sync ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={handleSync}
                  disabled={loading.sync || (!connectionStatus.googleFit.connected && !connectionStatus.samsungHealth.connected)}
                >
                  {loading.sync ? 'Syncing...' : 'Sync Now'}
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {syncStats.total.weight}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Weight Entries
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {syncStats.total.sleep}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sleep Entries
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {(connectionStatus.googleFit.connected ? 1 : 0) + (connectionStatus.samsungHealth.connected ? 1 : 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connected Services
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HealthIntegrationsPage;