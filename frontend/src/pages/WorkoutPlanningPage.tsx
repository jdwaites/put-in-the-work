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

interface Exercise {
  id: string;
  name: string;
  description: string;
  videoUrl?: string; // YouTube URL
  notes?: string; // Detailed instructions
  sets?: number;
  reps?: string; // Could be "10-12" or "30 seconds" etc.
  weight?: string;
  restTime?: string;
}

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
  exercises: Exercise[]; // Added exercises array
}

const WorkoutPlanningPage: React.FC = () => {
  const { currentProfile, profiles, getProfileData, setProfileData } = useProfile();
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openExerciseDialog, setOpenExerciseDialog] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string>('');
  
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
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Exercise form state
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [exerciseVideoUrl, setExerciseVideoUrl] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [exerciseSets, setExerciseSets] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseRestTime, setExerciseRestTime] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

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
    try {
      const savedWorkouts = getProfileData('plannedWorkouts');
      if (savedWorkouts && Array.isArray(savedWorkouts)) {
        // Ensure exercises array exists for backward compatibility
        const workoutsWithExercises = savedWorkouts.map((workout: any) => ({
          ...workout,
          exercises: workout.exercises || []
        }));
        setPlannedWorkouts(workoutsWithExercises);
        console.log('Loaded workouts:', workoutsWithExercises.length);
      } else {
        setPlannedWorkouts([]);
        console.log('No saved workouts found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setSaveError('Error loading saved workouts');
    }
  }, [currentProfile.id, getProfileData]);

  // Save planned workouts whenever they change
  useEffect(() => {
    if (plannedWorkouts.length >= 0) { // Changed from > 0 to >= 0 to save empty arrays
      try {
        setProfileData('plannedWorkouts', plannedWorkouts);
        console.log('Saved workouts:', plannedWorkouts.length);
        if (saveError) setSaveError(''); // Clear any previous errors
      } catch (error) {
        console.error('Error saving workouts:', error);
        setSaveError('Failed to save workout data');
      }
    }
  }, [plannedWorkouts, currentProfile.id, setProfileData]);

  const createPlannedWorkout = () => {
    setSaveError('');
    
    if (!title.trim()) {
      setSaveError('Title is required');
      return;
    }
    if (!scheduledDate) {
      setSaveError('Scheduled date is required');
      return;
    }
    if (!estimatedDuration || parseInt(estimatedDuration) <= 0) {
      setSaveError('Valid estimated duration is required');
      return;
    }
    if (participants.length === 0) {
      setSaveError('At least one participant is required');
      return;
    }

    try {
      const newWorkout: PlannedWorkout = {
        id: Date.now().toString(),
        sport,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        subcategory: subcategory.trim(),
        scheduledDate,
        estimatedDuration: parseInt(estimatedDuration),
        participants,
        coach: currentProfile.id,
        isCompleted: false,
        notes: notes.trim(),
        exercises: exercises.map(ex => ({ ...ex })) // Create a copy of exercises
      };
      
      setPlannedWorkouts(prev => [...prev, newWorkout]);
      setSaveSuccess('Workout plan created successfully!');
      
      // Clear form
      clearForm();
      setOpenDialog(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating workout:', error);
      setSaveError('Failed to create workout plan');
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setSubcategory('');
    setScheduledDate('');
    setEstimatedDuration('');
    setParticipants([]);
    setNotes('');
    setExercises([]);
  };

  const addExercise = () => {
    if (!exerciseName.trim()) {
      setSaveError('Exercise name is required');
      return;
    }

    try {
      const newExercise: Exercise = {
        id: Date.now().toString(),
        name: exerciseName.trim(),
        description: exerciseDescription.trim(),
        videoUrl: exerciseVideoUrl.trim() || undefined,
        notes: exerciseNotes.trim() || undefined,
        sets: exerciseSets ? parseInt(exerciseSets) : undefined,
        reps: exerciseReps.trim() || undefined,
        weight: exerciseWeight.trim() || undefined,
        restTime: exerciseRestTime.trim() || undefined,
      };

      setExercises(prev => [...prev, newExercise]);
      
      // Clear exercise form
      setExerciseName('');
      setExerciseDescription('');
      setExerciseVideoUrl('');
      setExerciseNotes('');
      setExerciseSets('');
      setExerciseReps('');
      setExerciseWeight('');
      setExerciseRestTime('');
      setOpenExerciseDialog(false);
      setSaveError('');
    } catch (error) {
      console.error('Error adding exercise:', error);
      setSaveError('Failed to add exercise');
    }
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
      <Dialog open={openDialog} onClose={() => {setOpenDialog(false); clearForm(); setSaveError('');}} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PlanIcon sx={{ mr: 1 }} />
            Plan New Workout
          </Box>
        </DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Workout Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Morning Basketball Training"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={2}
                placeholder="Brief description of the workout session"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Date & Time"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                required
                inputProps={{ min: 1, max: 480 }}
              />
            </Grid>

            {/* Participants Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Participants *
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

            {/* Exercises Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Exercises ({exercises.length})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenExerciseDialog(true)}
                >
                  Add Exercise
                </Button>
              </Box>
              
              {exercises.length > 0 && (
                <List dense>
                  {exercises.map((exercise) => (
                    <ListItem key={exercise.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={exercise.name}
                        secondary={
                          <Box>
                            {exercise.description && (
                              <Typography variant="body2" color="text.secondary">
                                {exercise.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                              {exercise.sets && <Chip size="small" label={`${exercise.sets} sets`} />}
                              {exercise.reps && <Chip size="small" label={`${exercise.reps} reps`} />}
                              {exercise.weight && <Chip size="small" label={`${exercise.weight}`} />}
                              {exercise.restTime && <Chip size="small" label={`Rest: ${exercise.restTime}`} />}
                            </Box>
                            {exercise.videoUrl && (
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  size="small" 
                                  label="📹 Video Guide" 
                                  color="primary" 
                                  variant="outlined"
                                  onClick={() => window.open(exercise.videoUrl, '_blank')}
                                  clickable
                                />
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <IconButton
                        edge="end"
                        color="error"
                        size="small"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Any additional notes or reminders for this workout..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setOpenDialog(false); clearForm(); setSaveError('');}}>
            Cancel
          </Button>
          <Button 
            onClick={createPlannedWorkout} 
            variant="contained"
            disabled={!title || !scheduledDate || !estimatedDuration || participants.length === 0}
          >
            Create Workout Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={openExerciseDialog} onClose={() => setOpenExerciseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exercise Name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                required
                placeholder="e.g., Push-ups, Free throws, Burpees"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={exerciseDescription}
                onChange={(e) => setExerciseDescription(e.target.value)}
                multiline
                rows={2}
                placeholder="Brief description of the exercise"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="YouTube Video URL (optional)"
                value={exerciseVideoUrl}
                onChange={(e) => setExerciseVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                helperText="Paste a YouTube URL to link a demonstration video"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exercise Notes & Instructions"
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Detailed instructions on how to perform this exercise, form tips, safety notes, etc."
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Sets"
                type="number"
                value={exerciseSets}
                onChange={(e) => setExerciseSets(e.target.value)}
                placeholder="3"
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Reps/Duration"
                value={exerciseReps}
                onChange={(e) => setExerciseReps(e.target.value)}
                placeholder="10-12 or 30 seconds"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Weight (optional)"
                value={exerciseWeight}
                onChange={(e) => setExerciseWeight(e.target.value)}
                placeholder="50 lbs or bodyweight"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Rest Time"
                value={exerciseRestTime}
                onChange={(e) => setExerciseRestTime(e.target.value)}
                placeholder="60 seconds"
              />
            </Grid>

            {exerciseVideoUrl && extractYouTubeId(exerciseVideoUrl) && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Video Preview:
                  </Typography>
                  <Box 
                    component="iframe"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(exerciseVideoUrl)}`}
                    sx={{ width: '100%', height: 200, border: 'none', borderRadius: 1 }}
                    allowFullScreen
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExerciseDialog(false)}>Cancel</Button>
          <Button 
            onClick={addExercise}
            variant="contained"
            disabled={!exerciseName.trim()}
          >
            Add Exercise
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          <Alert severity="success" onClose={() => setSaveSuccess('')}>
            {saveSuccess}
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default WorkoutPlanningPage;