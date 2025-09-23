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
  FitnessCenter as WeightliftingIcon,
  Pool as SwimmingIcon,
  DirectionsRun as CardioIcon,
  TrackChanges as TrackIcon,
  SportsMma as BoxingIcon,
  Sports as OtherSportsIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

interface PlannedWorkout {
  id: string;
  sport: 'basketball' | 'football' | 'weightlifting' | 'swimming' | 'cardio' | 'track' | 'boxing' | 'other';
  title: string;
  description: string;
  category: string;
  subcategory: string;
  scheduledDate: string;
  estimatedDuration: number;
  participants: string[];
  coach: string;
  isCompleted: boolean;
  completedDate?: string;
  notes: string;
}

const WorkoutPlanningPage: React.FC = () => {
  const { currentProfile, profiles, getProfileData, setProfileData } = useProfile();
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form state
  const [sport, setSport] = useState<'basketball' | 'football' | 'weightlifting' | 'swimming' | 'cardio' | 'track' | 'boxing' | 'other'>('basketball');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Basketball and Football categories (same as SportsTrainingPage)
  const basketballCategories = {
    'Ball Handling': [
      'Basic Dribbling',
      'Advanced Dribbling',
      'Stationary Drills',
      'Moving Drills',
      'Two-Ball Drills',
      'Cone Weaving'
    ],
    'Shooting': [
      'Form Shooting',
      'Free Throws',
      'Mid-Range Shots',
      'Three-Point Shooting',
      'Catch and Shoot',
      'Off the Dribble',
      'Game Shots',
      'Shooting Under Pressure'
    ],
    'Defense': [
      'Stance and Footwork',
      'Lateral Movement',
      'Close-out Drills',
      'Help Defense',
      'On-ball Defense',
      'Defensive Slides',
      'Communication',
      'Team Defense'
    ],
    'Conditioning': [
      'Sprint Drills',
      'Agility Ladders',
      'Cone Drills',
      'Endurance Running',
      'Plyometrics',
      'Core Strength',
      'Flexibility',
      'Recovery'
    ]
  };

  const footballCategories = {
    'Catching': [
      'Basic Catching',
      'One-Handed Catches',
      'Over-the-Shoulder',
      'Sideline Catches',
      'Contested Catches',
      'Route Running',
      'Hands Drills',
      'Concentration Drills'
    ],
    'Passing': [
      'Throwing Mechanics',
      'Accuracy Drills',
      'Footwork',
      'Quick Release',
      'Deep Balls',
      'Touch Passes',
      'Pocket Presence',
      'Reading Defense'
    ],
    'Running': [
      'Carry Technique',
      'Vision Drills',
      'Cut Drills',
      'Power Running',
      'Speed Training',
      'Agility',
      'Ball Security',
      'Pass Protection'
    ],
    'Conditioning': [
      'Sprint Drills',
      'Agility Ladders',
      'Cone Drills',
      'Endurance Running',
      'Plyometrics',
      'Core Strength',
      'Flexibility',
      'Position Specific'
    ]
  };

  const weightliftingCategories = {
    'Upper Body': [
      'Bench Press',
      'Pull-ups',
      'Rows',
      'Shoulder Press',
      'Bicep Curls',
      'Tricep Extensions',
      'Chest Flyes',
      'Lat Pulldowns'
    ],
    'Lower Body': [
      'Squats',
      'Deadlifts',
      'Lunges',
      'Leg Press',
      'Calf Raises',
      'Leg Curls',
      'Leg Extensions',
      'Hip Thrusts'
    ],
    'Core': [
      'Planks',
      'Crunches',
      'Russian Twists',
      'Leg Raises',
      'Mountain Climbers',
      'Dead Bugs',
      'Side Planks',
      'Ab Wheels'
    ],
    'Functional': [
      'Olympic Lifts',
      'Compound Movements',
      'Kettlebell Work',
      'Bodyweight',
      'Stability Training',
      'Power Training',
      'Mobility Work',
      'Recovery'
    ]
  };

  const swimmingCategories = {
    'Stroke Technique': [
      'Freestyle',
      'Backstroke',
      'Breaststroke',
      'Butterfly',
      'Individual Medley',
      'Kick Technique',
      'Pull Technique',
      'Breathing'
    ],
    'Endurance': [
      'Distance Swimming',
      'Interval Training',
      'Tempo Sets',
      'Aerobic Base',
      'Threshold Training',
      'Recovery Swimming',
      'Open Water',
      'Long Sets'
    ],
    'Speed': [
      'Sprint Sets',
      'Start Technique',
      'Turn Technique',
      'Finish Technique',
      'Race Pace',
      'Power Training',
      'Short Rest',
      'Competition Prep'
    ],
    'Drills': [
      'Catch-up Drill',
      'Single Arm',
      'Finger Drag',
      'High Elbow',
      'Sculling',
      'Kick Board',
      'Pull Buoy',
      'Paddles'
    ]
  };

  const cardioCategories = {
    'Running': [
      'Easy Runs',
      'Tempo Runs',
      'Interval Training',
      'Long Runs',
      'Hill Training',
      'Fartlek',
      'Recovery Runs',
      'Treadmill'
    ],
    'Cycling': [
      'Endurance Rides',
      'Hill Climbs',
      'Interval Training',
      'Sprint Training',
      'Recovery Rides',
      'Indoor Cycling',
      'Time Trials',
      'Group Rides'
    ],
    'Rowing': [
      'Steady State',
      'Interval Training',
      'Sprint Pieces',
      'Long Distance',
      'Technique Work',
      'Power Training',
      'Recovery Rows',
      'Machine Work'
    ],
    'Other': [
      'Elliptical',
      'Stair Climber',
      'Jump Rope',
      'Dancing',
      'Hiking',
      'Circuit Training',
      'HIIT',
      'Cross Training'
    ]
  };

  const trackCategories = {
    'Sprints': [
      '100m',
      '200m',
      '400m',
      'Relay',
      'Hurdles',
      'Block Starts',
      'Acceleration',
      'Top Speed'
    ],
    'Middle Distance': [
      '800m',
      '1500m',
      'Mile',
      'Steeplechase',
      'Pace Training',
      'Kick Training',
      'Tactical Training',
      'Speed Endurance'
    ],
    'Distance': [
      '3000m',
      '5000m',
      '10000m',
      'Cross Country',
      'Marathon Training',
      'Base Building',
      'Tempo Training',
      'Long Runs'
    ],
    'Field Events': [
      'Long Jump',
      'High Jump',
      'Pole Vault',
      'Shot Put',
      'Discus',
      'Javelin',
      'Hammer',
      'Decathlon'
    ]
  };

  const boxingCategories = {
    'Technique': [
      'Jab',
      'Cross',
      'Hook',
      'Uppercut',
      'Combinations',
      'Footwork',
      'Defense',
      'Counter Punching'
    ],
    'Conditioning': [
      'Heavy Bag',
      'Speed Bag',
      'Double End Bag',
      'Jump Rope',
      'Shadowboxing',
      'Core Work',
      'Roadwork',
      'Circuit Training'
    ],
    'Sparring': [
      'Technical Sparring',
      'Light Sparring',
      'Hard Sparring',
      'Focus Mitts',
      'Partner Drills',
      'Ring Work',
      'Competition Prep',
      'Recovery Sparring'
    ],
    'Strength': [
      'Power Training',
      'Speed Training',
      'Explosive Movements',
      'Functional Strength',
      'Hand Strength',
      'Neck Strengthening',
      'Flexibility',
      'Injury Prevention'
    ]
  };

  const otherCategories = {
    'General Fitness': [
      'Bodyweight Training',
      'Flexibility',
      'Balance Training',
      'Coordination',
      'Agility',
      'Functional Movement',
      'Recovery Work',
      'Mobility'
    ],
    'Team Sports': [
      'Soccer',
      'Volleyball',
      'Tennis',
      'Badminton',
      'Table Tennis',
      'Ultimate Frisbee',
      'Lacrosse',
      'Field Hockey'
    ],
    'Individual Sports': [
      'Golf',
      'Gymnastics',
      'Martial Arts',
      'Rock Climbing',
      'Skateboarding',
      'Surfing',
      'Skiing',
      'Snowboarding'
    ],
    'Outdoor Activities': [
      'Hiking',
      'Mountain Biking',
      'Trail Running',
      'Kayaking',
      'Stand-up Paddling',
      'Rock Climbing',
      'Adventure Racing',
      'Obstacle Racing'
    ]
  };

  const getCurrentCategories = (): { [key: string]: string[] } => {
    switch (sport) {
      case 'basketball': return basketballCategories;
      case 'football': return footballCategories;
      case 'weightlifting': return weightliftingCategories;
      case 'swimming': return swimmingCategories;
      case 'cardio': return cardioCategories;
      case 'track': return trackCategories;
      case 'boxing': return boxingCategories;
      case 'other': return otherCategories;
      default: return {};
    }
  };

  const getCurrentSubcategories = (): string[] => {
    const categories = getCurrentCategories();
    return categories[category as keyof typeof categories] || [];
  };

  const getSportIcon = (sportType: string) => {
    switch (sportType) {
      case 'basketball': return <BasketballIcon />;
      case 'football': return <FootballIcon />;
      case 'weightlifting': return <WeightliftingIcon />;
      case 'swimming': return <SwimmingIcon />;
      case 'cardio': return <CardioIcon />;
      case 'track': return <TrackIcon />;
      case 'boxing': return <BoxingIcon />;
      case 'other': return <OtherSportsIcon />;
      default: return <OtherSportsIcon />;
    }
  };

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
    if (title && category && subcategory && scheduledDate && estimatedDuration && participants.length > 0) {
      const newWorkout: PlannedWorkout = {
        id: Date.now().toString(),
        sport,
        title,
        description,
        category,
        subcategory,
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
      setCategory('');
      setSubcategory('');
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
      workout.id === id ? { ...workout, isCompleted: true, completedDate: new Date().toISOString() } : workout
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
      .sort((a, b) => {
        const dateA = a.completedDate ? new Date(a.completedDate) : new Date(a.scheduledDate);
        const dateB = b.completedDate ? new Date(b.completedDate) : new Date(b.scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });
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
                          {getSportIcon(workout.sport)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="h6">{workout.title}</Typography>
                              {workout.category && workout.subcategory && (
                                <Typography variant="body2" color="primary">
                                  {workout.category} - {workout.subcategory}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(workout.scheduledDate).toLocaleDateString()} - {workout.estimatedDuration} min
                              </Typography>
                              {workout.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {workout.description}
                                </Typography>
                              )}
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
                          {getSportIcon(workout.sport)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1">
                                  {workout.title}
                                </Typography>
                                {workout.category && workout.subcategory && (
                                  <Typography variant="body2" color="primary">
                                    {workout.category} - {workout.subcategory}
                                  </Typography>
                                )}
                              </Box>
                              <CompleteIcon color="success" fontSize="small" />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Completed: {workout.completedDate ? 
                                  new Date(workout.completedDate).toLocaleDateString() : 
                                  new Date(workout.scheduledDate).toLocaleDateString()
                                } - {workout.estimatedDuration} min
                              </Typography>
                              {workout.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {workout.description}
                                </Typography>
                              )}
                            </Box>
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
                  onChange={(e) => {
                    setSport(e.target.value as any);
                    setCategory('');
                    setSubcategory('');
                  }}
                >
                  <MenuItem value="basketball">Basketball</MenuItem>
                  <MenuItem value="football">Football</MenuItem>
                  <MenuItem value="weightlifting">Weightlifting</MenuItem>
                  <MenuItem value="swimming">Swimming</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="track">Track & Field</MenuItem>
                  <MenuItem value="boxing">Boxing</MenuItem>
                  <MenuItem value="other">Other Sports</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                >
                  {Object.keys(getCurrentCategories()).map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!category}>
                <InputLabel>Specific Activity</InputLabel>
                <Select
                  value={subcategory}
                  label="Specific Activity"
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  {getCurrentSubcategories().map((subcat) => (
                    <MenuItem key={subcat} value={subcat}>{subcat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Workout Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'Basketball Shooting Practice'"
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