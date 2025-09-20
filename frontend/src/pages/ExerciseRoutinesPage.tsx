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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Rating,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Timer as TimerIcon,
  FitnessCenter as WorkoutIcon,
  TrendingUp as StatsIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { exerciseRoutineService, WorkoutRoutine, Exercise, ExerciseSet, RoutineExercise, WorkoutSession } from '../utils/exerciseRoutines';

interface TabPanelProps {
  children?: any;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ExerciseRoutinesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [exercises] = useState<Exercise[]>(exerciseRoutineService.getExerciseDatabase());
  
  // Dialog states
  const [createRoutineOpen, setCreateRoutineOpen] = useState(false);
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false);
  const [workoutSessionOpen, setWorkoutSessionOpen] = useState(false);
  
  // Form states
  const [routineForm, setRoutineForm] = useState({
    name: '',
    description: '',
    category: 'strength' as const,
    difficulty: 'beginner' as const,
    exercises: [] as RoutineExercise[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRoutines(exerciseRoutineService.getAllRoutines());
    setCurrentSession(exerciseRoutineService.getCurrentSession());
  };

  const handleCreateRoutine = () => {
    if (!routineForm.name.trim()) {
      setSnackbar({ open: true, message: 'Please enter a routine name', severity: 'error' });
      return;
    }

    try {
      const estimatedDuration = routineForm.exercises.reduce((total, exercise) => {
        const exerciseTime = exercise.sets.reduce((setTotal, set) => {
          const workTime = set.duration || (set.reps ? set.reps * 3 : 0); // 3 seconds per rep estimate
          const restTime = set.restTime || 0;
          return setTotal + workTime + restTime;
        }, 0);
        return total + exerciseTime;
      }, 0) / 60; // Convert to minutes

      exerciseRoutineService.createRoutine({
        ...routineForm,
        estimatedDuration: Math.ceil(estimatedDuration),
        tags: [],
        isFavorite: false,
        createdBy: 'user'
      });

      setCreateRoutineOpen(false);
      setRoutineForm({
        name: '',
        description: '',
        category: 'strength',
        difficulty: 'beginner',
        exercises: []
      });
      
      setSnackbar({ open: true, message: 'Routine created successfully!', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create routine', severity: 'error' });
    }
  };

  const handleAddExerciseToRoutine = (exercise: Exercise) => {
    const routineExercise: RoutineExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [
        {
          setNumber: 1,
          reps: exercise.defaultReps,
          duration: exercise.defaultDuration,
          weight: exercise.defaultWeight,
          restTime: 60,
          completed: false
        }
      ],
      restBetweenSets: 60
    };

    setRoutineForm({
      ...routineForm,
      exercises: [...routineForm.exercises, routineExercise]
    });
    setExerciseSearchOpen(false);
  };

  const handleRemoveExerciseFromRoutine = (exerciseId: string) => {
    setRoutineForm({
      ...routineForm,
      exercises: routineForm.exercises.filter(ex => ex.id !== exerciseId)
    });
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...routineForm.exercises];
    const exercise = updatedExercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    exercise.sets.push({
      setNumber: exercise.sets.length + 1,
      reps: lastSet.reps,
      duration: lastSet.duration,
      weight: lastSet.weight,
      restTime: lastSet.restTime,
      completed: false
    });

    setRoutineForm({ ...routineForm, exercises: updatedExercises });
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: any) => {
    const updatedExercises = [...routineForm.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    setRoutineForm({ ...routineForm, exercises: updatedExercises });
  };

  const handleStartWorkout = (routineId: string) => {
    try {
      const session = exerciseRoutineService.startWorkoutSession(routineId);
      setCurrentSession(session);
      setWorkoutSessionOpen(true);
      setSnackbar({ open: true, message: 'Workout started!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to start workout', severity: 'error' });
    }
  };

  const handleCompleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!currentSession) return;
    
    const updatedSession = exerciseRoutineService.completeSet(exerciseIndex, setIndex);
    setCurrentSession(updatedSession);
  };

  const handleFinishWorkout = (rating?: number, notes?: string) => {
    try {
      exerciseRoutineService.finishWorkoutSession(rating, notes);
      setCurrentSession(null);
      setWorkoutSessionOpen(false);
      setSnackbar({ open: true, message: 'Workout completed!', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to finish workout', severity: 'error' });
    }
  };

  const handleToggleFavorite = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      exerciseRoutineService.updateRoutine(routineId, { isFavorite: !routine.isFavorite });
      loadData();
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (window.confirm('Are you sure you want to delete this routine?')) {
      exerciseRoutineService.deleteRoutine(routineId);
      loadData();
      setSnackbar({ open: true, message: 'Routine deleted', severity: 'success' });
    }
  };

  const handleDuplicateRoutine = (routineId: string) => {
    exerciseRoutineService.duplicateRoutine(routineId);
    loadData();
    setSnackbar({ open: true, message: 'Routine duplicated', severity: 'success' });
  };

  const getFilteredExercises = () => {
    let filtered = exercises;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = exerciseRoutineService.searchExercises(searchQuery);
    }
    
    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '❤️';
      case 'hiit': return '🔥';
      case 'flexibility': return '🧘';
      case 'mixed': return '🏃';
      default: return '💪';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Exercise Routines
        </Typography>
        {currentSession && (
          <Badge badgeContent="Live" color="error">
            <Button
              variant="contained"
              color="success"
              startIcon={<TimerIcon />}
              onClick={() => setWorkoutSessionOpen(true)}
            >
              Resume Workout
            </Button>
          </Badge>
        )}
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="My Routines" />
        <Tab label="Exercise Library" />
        <Tab label="Workout History" />
      </Tabs>

      {/* My Routines Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            {routines.length} Routines Created
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateRoutineOpen(true)}
          >
            Create New Routine
          </Button>
        </Box>

        <Grid container spacing={3}>
          {routines.map((routine) => {
            const stats = exerciseRoutineService.getRoutineStats(routine.id);
            return (
              <Grid item xs={12} md={6} key={routine.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {getCategoryIcon(routine.category)} {routine.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {routine.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFavorite(routine.id)}
                          color={routine.isFavorite ? 'error' : 'default'}
                        >
                          {routine.isFavorite ? <FavoriteIcon /> : <FavoriteOutlineIcon />}
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDuplicateRoutine(routine.id)}>
                          <CopyIcon />
                        </IconButton>
                        {routine.createdBy === 'user' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteRoutine(routine.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" gap={1} mb={2}>
                      <Chip 
                        label={routine.difficulty} 
                        size="small" 
                        color={getDifficultyColor(routine.difficulty) as any}
                      />
                      <Chip label={`${routine.estimatedDuration} min`} size="small" variant="outlined" />
                      <Chip label={`${routine.exercises.length} exercises`} size="small" variant="outlined" />
                    </Box>

                    {stats.timesCompleted > 0 && (
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary">
                          Completed {stats.timesCompleted} times • 
                          Avg. duration: {stats.averageDuration}min
                          {stats.averageRating > 0 && ` • Rating: ${stats.averageRating}⭐`}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      fullWidth
                      onClick={() => handleStartWorkout(routine.id)}
                      disabled={!!currentSession}
                    >
                      Start Workout
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      {/* Exercise Library Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="strength">Strength</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="core">Core</MenuItem>
                  <MenuItem value="flexibility">Flexibility</MenuItem>
                  <MenuItem value="functional">Functional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          {getFilteredExercises().map((exercise) => (
            <Grid item xs={12} md={6} key={exercise.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {exercise.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {exercise.description}
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    <Chip label={exercise.category} size="small" color="primary" />
                    {exercise.muscleGroups.slice(0, 2).map(muscle => (
                      <Chip key={muscle} label={muscle} size="small" variant="outlined" />
                    ))}
                    {exercise.muscleGroups.length > 2 && (
                      <Chip label={`+${exercise.muscleGroups.length - 2} more`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Instructions</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {exercise.instructions.map((instruction, index) => (
                          <ListItem key={index}>
                            <ListItemText 
                              primary={`${index + 1}. ${instruction}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Workout History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Recent Workouts
        </Typography>
        {exerciseRoutineService.getWorkoutHistory().length === 0 ? (
          <Alert severity="info">
            No workouts completed yet. Start a routine to see your history here!
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {exerciseRoutineService.getWorkoutHistory().slice(-10).reverse().map((session) => (
              <Grid item xs={12} key={session.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="between" alignItems="start">
                      <Box>
                        <Typography variant="h6">{session.routineName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.startTime).toLocaleDateString()} • 
                          {session.duration} minutes • 
                          {session.completedSets}/{session.totalSets} sets completed
                        </Typography>
                        {session.rating && (
                          <Rating value={session.rating} readOnly size="small" sx={{ mt: 1 }} />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Create Routine Dialog */}
      <Dialog open={createRoutineOpen} onClose={() => setCreateRoutineOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Routine</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Routine Name"
                value={routineForm.name}
                onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={routineForm.description}
                onChange={(e) => setRoutineForm({ ...routineForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={routineForm.category}
                  onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value as any })}
                  label="Category"
                >
                  <MenuItem value="strength">Strength</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="hiit">HIIT</MenuItem>
                  <MenuItem value="flexibility">Flexibility</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={routineForm.difficulty}
                  onChange={(e) => setRoutineForm({ ...routineForm, difficulty: e.target.value as any })}
                  label="Difficulty"
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">Exercises ({routineForm.exercises.length})</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setExerciseSearchOpen(true)}
              >
                Add Exercise
              </Button>
            </Box>

            {routineForm.exercises.map((routineExercise, index) => (
              <Card key={routineExercise.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
                    <Typography variant="h6">{routineExercise.exercise.name}</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveExerciseFromRoutine(routineExercise.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {routineExercise.sets.map((set, setIndex) => (
                    <Box key={setIndex} display="flex" gap={2} alignItems="center" mb={1}>
                      <Typography variant="body2" minWidth="40px">
                        Set {set.setNumber}:
                      </Typography>
                      {routineExercise.exercise.defaultReps !== undefined && (
                        <TextField
                          size="small"
                          label="Reps"
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => handleUpdateSet(index, setIndex, 'reps', parseInt(e.target.value))}
                          sx={{ width: 80 }}
                        />
                      )}
                      {routineExercise.exercise.defaultDuration !== undefined && (
                        <TextField
                          size="small"
                          label="Duration (s)"
                          type="number"
                          value={set.duration || ''}
                          onChange={(e) => handleUpdateSet(index, setIndex, 'duration', parseInt(e.target.value))}
                          sx={{ width: 100 }}
                        />
                      )}
                      {routineExercise.exercise.defaultWeight !== undefined && (
                        <TextField
                          size="small"
                          label="Weight (lbs)"
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => handleUpdateSet(index, setIndex, 'weight', parseInt(e.target.value))}
                          sx={{ width: 100 }}
                        />
                      )}
                      <TextField
                        size="small"
                        label="Rest (s)"
                        type="number"
                        value={set.restTime || ''}
                        onChange={(e) => handleUpdateSet(index, setIndex, 'restTime', parseInt(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </Box>
                  ))}
                  
                  <Button
                    size="small"
                    onClick={() => handleAddSet(index)}
                    startIcon={<AddIcon />}
                  >
                    Add Set
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoutineOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRoutine} variant="contained">
            Create Routine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exercise Search Dialog */}
      <Dialog open={exerciseSearchOpen} onClose={() => setExerciseSearchOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Exercise to Routine</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <List>
            {getFilteredExercises().map((exercise) => (
              <ListItem key={exercise.id}>
                <ListItemText
                  primary={exercise.name}
                  secondary={`${exercise.category} • ${exercise.muscleGroups.join(', ')}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddExerciseToRoutine(exercise)}
                  >
                    Add
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExerciseSearchOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default ExerciseRoutinesPage;