import React, { useState, useEffect } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Event as PlanIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

interface PlannedWorkout {
  id: string;
  sport: 'basketball' | 'football';
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: number;
  participants: string[];
  coach: string;
  isCompleted: boolean;
  notes: string;
}

const WorkoutPlanningPage: React.FC = () => {
  const { currentProfile, profiles, getProfileData, setProfileData } = useProfile();
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form state
  const [sport, setSport] = useState<'basketball' | 'football'>('basketball');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Load planned workouts on component mount
  useEffect(() => {
    const savedWorkouts = getProfileData('plannedWorkouts');
    if (savedWorkouts) {
      setPlannedWorkouts(savedWorkouts);
    }
  }, [currentProfile.id, getProfileData]);

  // Save planned workouts whenever they change
  useEffect(() => {
    if (plannedWorkouts.length > 0) {
      setProfileData('plannedWorkouts', plannedWorkouts);
    }
  }, [plannedWorkouts, currentProfile.id, setProfileData]);

  const createPlannedWorkout = () => {
    if (title && scheduledDate && estimatedDuration && participants.length > 0) {
      const newWorkout: PlannedWorkout = {
        id: Date.now().toString(),
        sport,
        title,
        description,
        scheduledDate,
        estimatedDuration: parseInt(estimatedDuration),
        participants,
        coach: currentProfile.id,
        isCompleted: false,
        notes
      };
      
      setPlannedWorkouts([...plannedWorkouts, newWorkout]);
      
      // Clear form
      setTitle('');
      setDescription('');
      setScheduledDate('');
      setEstimatedDuration('');
      setParticipants([]);
      setNotes('');
      setOpenDialog(false);
    }
  };

  const deleteWorkout = (id: string) => {
    setPlannedWorkouts(plannedWorkouts.filter(workout => workout.id !== id));
  };

  const completeWorkout = (id: string) => {
    setPlannedWorkouts(plannedWorkouts.map(workout => 
      workout.id === id ? { ...workout, isCompleted: true } : workout
    ));
  };

  const getUpcomingWorkouts = () => {
    const now = new Date();
    return plannedWorkouts
      .filter(workout => !workout.isCompleted && new Date(workout.scheduledDate) >= now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  const getCompletedWorkouts = () => {
    return plannedWorkouts
      .filter(workout => workout.isCompleted)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  };

  const handleParticipantToggle = (profileId: string) => {
    setParticipants(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Workout Planning
        </Typography>
        <Fab color="primary" aria-label="add" onClick={() => setOpenDialog(true)}>
          <AddIcon />
        </Fab>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Plan future basketball and football training sessions with your family members. Track who will participate and when sessions are scheduled.
      </Alert>

      <Grid container spacing={3}>
        {/* Upcoming Workouts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Workouts ({getUpcomingWorkouts().length})
              </Typography>
              {getUpcomingWorkouts().length === 0 ? (
                <Typography color="text.secondary">
                  No upcoming workouts planned. Click the + button to create one.
                </Typography>
              ) : (
                <List>
                  {getUpcomingWorkouts().map((workout) => (
                    <React.Fragment key={workout.id}>
                      <ListItem>
                        <ListItemIcon>
                          {workout.sport === 'basketball' ? <BasketballIcon /> : <FootballIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={workout.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(workout.scheduledDate).toLocaleDateString()} - {workout.estimatedDuration} min
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {workout.participants.map(participantId => {
                                  const participant = profiles.find(p => p.id === participantId);
                                  return participant ? (
                                    <Chip 
                                      key={participantId}
                                      label={participant.name}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ) : null;
                                })}
                              </Box>
                            </Box>
                          }
                        />
                        <Box>
                          <IconButton 
                            color="success" 
                            onClick={() => completeWorkout(workout.id)}
                            title="Mark as completed"
                          >
                            <CompleteIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => deleteWorkout(workout.id)}
                            title="Delete workout"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Workouts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Workouts ({getCompletedWorkouts().length})
              </Typography>
              {getCompletedWorkouts().length === 0 ? (
                <Typography color="text.secondary">
                  No completed workouts yet.
                </Typography>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {getCompletedWorkouts().slice(0, 10).map((workout) => (
                    <React.Fragment key={workout.id}>
                      <ListItem>
                        <ListItemIcon>
                          {workout.sport === 'basketball' ? <BasketballIcon /> : <FootballIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" sx={{ mr: 1 }}>
                                {workout.title}
                              </Typography>
                              <CompleteIcon color="success" fontSize="small" />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {new Date(workout.scheduledDate).toLocaleDateString()}
                            </Typography>
                          }
                        />
                        <IconButton 
                          color="error" 
                          onClick={() => deleteWorkout(workout.id)}
                          title="Delete workout"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Workout Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PlanIcon sx={{ mr: 1 }} />
            Plan New Workout
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sport</InputLabel>
                <Select
                  value={sport}
                  label="Sport"
                  onChange={(e) => setSport(e.target.value as 'basketball' | 'football')}
                >
                  <MenuItem value="basketball">Basketball</MenuItem>
                  <MenuItem value="football">Football</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Workout Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'Basketball Fundamentals Training'"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Describe what you'll work on in this session..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="60"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Participants
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profiles.map((profile) => (
                  <Chip
                    key={profile.id}
                    label={profile.name}
                    onClick={() => handleParticipantToggle(profile.id)}
                    color={participants.includes(profile.id) ? 'primary' : 'default'}
                    variant={participants.includes(profile.id) ? 'filled' : 'outlined'}
                    icon={<PersonIcon />}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                placeholder="Any additional notes for this workout..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={createPlannedWorkout} 
            variant="contained"
            disabled={!title || !scheduledDate || !estimatedDuration || participants.length === 0}
          >
            Create Workout Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkoutPlanningPage;