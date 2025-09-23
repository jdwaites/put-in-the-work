import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const TrackerPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exercise Tracker
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Track your workouts and exercises
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Log your sets, reps, weights, and track your progress over time.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TrackerPage;
