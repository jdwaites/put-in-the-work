import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Alert
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const HealthIntegrationsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Health Integrations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Integration with external health platforms and services
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <WarningIcon sx={{ mt: 0.1 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Health API Integrations Currently Unavailable
                </Typography>
                <Typography variant="body2" paragraph>
                  Integration with Google Fit and Samsung Health APIs requires regulatory compliance, OAuth setup, and API approvals.
                  This version focuses on local data storage for maximum privacy.
                </Typography>
              </Box>
            </Box>
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Available Data Input Methods
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your fitness data using manual entry methods for complete privacy and control.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacy-First Approach
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All data stored locally in your browser with no external sharing.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HealthIntegrationsPage;
