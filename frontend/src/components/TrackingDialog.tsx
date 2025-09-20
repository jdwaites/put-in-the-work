import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  IconButton,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { trackingService, WeightEntry, SleepEntry, MealEntry, WorkoutEntry, DiaryEntry } from '../firebase/tracking';

interface TrackingDialogProps {
  open: boolean;
  onClose: () => void;
  type: string;
  onSuccess: () => void;
}

const TrackingDialog: React.FC<TrackingDialogProps> = ({ open, onClose, type, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      switch (type) {
        case 'weight':
          await trackingService.addWeightEntry(data);
          break;
        case 'sleep':
          await trackingService.addSleepEntry(data);
          break;
        case 'meal':
          await trackingService.addMealEntry(data);
          break;
        case 'workout':
          await trackingService.addWorkoutEntry(data);
          break;
        case 'diary':
          await trackingService.addDiaryEntry(data);
          break;
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'weight':
        return <WeightForm onSubmit={handleSubmit} loading={loading} />;
      case 'sleep':
        return <SleepForm onSubmit={handleSubmit} loading={loading} />;
      case 'meal':
        return <MealForm onSubmit={handleSubmit} loading={loading} />;
      case 'workout':
        return <WorkoutForm onSubmit={handleSubmit} loading={loading} />;
      case 'diary':
        return <DiaryForm onSubmit={handleSubmit} loading={loading} />;
      default:
        return <Typography>Select a tracking type</Typography>;
    }
  };

  const getTitle = () => {
    const titles: { [key: string]: string } = {
      weight: 'Log Weight',
      sleep: 'Log Sleep',
      meal: 'Log Meal',
      workout: 'Log Workout',
      diary: 'Daily Journal'
    };
    return titles[type] || 'Add Entry';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
};

const WeightForm: React.FC<{ onSubmit: (data: any) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  const handleSubmit = () => {
    const data = {
      weight: parseFloat(weight),
      unit,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      notes: notes || undefined,
      timestamp
    };
    onSubmit(data);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TextField
            fullWidth
            label="Weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Unit</InputLabel>
            <Select value={unit} label="Unit" onChange={(e) => setUnit(e.target.value as 'kg' | 'lbs')}>
              <MenuItem value="lbs">lbs</MenuItem>
              <MenuItem value="kg">kg</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Body Fat %"
            type="number"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Muscle Mass"
            type="number"
            value={muscleMass}
            onChange={(e) => setMuscleMass(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <DateTimePicker
            label="Date & Time"
            value={timestamp}
            onChange={(newValue) => setTimestamp(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !weight}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Weight Entry'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const SleepForm: React.FC<{ onSubmit: (data: any) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [bedTime, setBedTime] = useState<Date>(new Date());
  const [wakeTime, setWakeTime] = useState<Date>(new Date());
  const [quality, setQuality] = useState<number>(3);
  const [restfulness, setRestfulness] = useState<number>(3);
  const [notes, setNotes] = useState('');

  const calculateDuration = () => {
    const diff = wakeTime.getTime() - bedTime.getTime();
    return Math.max(0, diff / (1000 * 60)); // minutes
  };

  const handleSubmit = () => {
    const data = {
      bedTime,
      wakeTime,
      duration: calculateDuration(),
      quality,
      restfulness,
      notes: notes || undefined,
      timestamp: new Date()
    };
    onSubmit(data);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <DateTimePicker
            label="Bed Time"
            value={bedTime}
            onChange={(newValue) => setBedTime(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={6}>
          <DateTimePicker
            label="Wake Time"
            value={wakeTime}
            onChange={(newValue) => setWakeTime(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Duration: {Math.floor(calculateDuration() / 60)}h {Math.round(calculateDuration() % 60)}m
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography component="legend">Sleep Quality</Typography>
          <Rating
            value={quality}
            onChange={(event, newValue) => setQuality(newValue || 1)}
          />
        </Grid>
        <Grid item xs={6}>
          <Typography component="legend">Restfulness</Typography>
          <Rating
            value={restfulness}
            onChange={(event, newValue) => setRestfulness(newValue || 1)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Sleep Entry'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const MealForm: React.FC<{ onSubmit: (data: any) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foods, setFoods] = useState<any[]>([]);
  const [totalCalories, setTotalCalories] = useState('');
  const [totalProtein, setTotalProtein] = useState('');
  const [totalCarbs, setTotalCarbs] = useState('');
  const [totalFat, setTotalFat] = useState('');
  const [totalFiber, setTotalFiber] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  const handleSubmit = () => {
    const data = {
      mealType,
      foods,
      totalCalories: parseFloat(totalCalories) || 0,
      totalProtein: parseFloat(totalProtein) || 0,
      totalCarbs: parseFloat(totalCarbs) || 0,
      totalFat: parseFloat(totalFat) || 0,
      totalFiber: parseFloat(totalFiber) || 0,
      waterIntake: parseFloat(waterIntake) || 0,
      notes: notes || undefined,
      timestamp
    };
    onSubmit(data);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Meal Type</InputLabel>
            <Select value={mealType} label="Meal Type" onChange={(e) => setMealType(e.target.value as any)}>
              <MenuItem value="breakfast">Breakfast</MenuItem>
              <MenuItem value="lunch">Lunch</MenuItem>
              <MenuItem value="dinner">Dinner</MenuItem>
              <MenuItem value="snack">Snack</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <DateTimePicker
            label="Date & Time"
            value={timestamp}
            onChange={(newValue) => setTimestamp(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Total Calories"
            type="number"
            value={totalCalories}
            onChange={(e) => setTotalCalories(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Protein (g)"
            type="number"
            value={totalProtein}
            onChange={(e) => setTotalProtein(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Carbs (g)"
            type="number"
            value={totalCarbs}
            onChange={(e) => setTotalCarbs(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Fat (g)"
            type="number"
            value={totalFat}
            onChange={(e) => setTotalFat(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Fiber (g)"
            type="number"
            value={totalFiber}
            onChange={(e) => setTotalFiber(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Water Intake (ml)"
            type="number"
            value={waterIntake}
            onChange={(e) => setWaterIntake(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Meal Entry'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const WorkoutForm: React.FC<{ onSubmit: (data: any) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [type, setType] = useState<'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'>('strength');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high' | 'very-high'>('moderate');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  const handleSubmit = () => {
    const data = {
      type,
      name,
      duration: parseFloat(duration) || 0,
      intensity,
      exercises: [], // Could be expanded to add specific exercises
      caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : undefined,
      notes: notes || undefined,
      timestamp
    };
    onSubmit(data);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Workout Type</InputLabel>
            <Select value={type} label="Workout Type" onChange={(e) => setType(e.target.value as any)}>
              <MenuItem value="strength">Strength</MenuItem>
              <MenuItem value="cardio">Cardio</MenuItem>
              <MenuItem value="flexibility">Flexibility</MenuItem>
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Intensity</InputLabel>
            <Select value={intensity} label="Intensity" onChange={(e) => setIntensity(e.target.value as any)}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="moderate">Moderate</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="very-high">Very High</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Workout Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Calories Burned"
            type="number"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <DateTimePicker
            label="Date & Time"
            value={timestamp}
            onChange={(newValue) => setTimestamp(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !name || !duration}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Workout Entry'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const DiaryForm: React.FC<{ onSubmit: (data: any) => void; loading: boolean }> = ({ onSubmit, loading }) => {
  const [mood, setMood] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [motivation, setMotivation] = useState<number>(3);
  const [freeForm, setFreeForm] = useState('');
  const [gratitude, setGratitude] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [tomorrowGoals, setTomorrowGoals] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  const handleSubmit = () => {
    const data = {
      mood,
      energyLevel,
      stressLevel,
      motivation,
      freeForm,
      gratitude: gratitude.length > 0 ? gratitude : undefined,
      achievements: achievements.length > 0 ? achievements : undefined,
      challenges: challenges.length > 0 ? challenges : undefined,
      tomorrowGoals: tomorrowGoals.length > 0 ? tomorrowGoals : undefined,
      timestamp
    };
    onSubmit(data);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography component="legend">Mood</Typography>
          <Rating value={mood} onChange={(event, newValue) => setMood(newValue || 1)} />
        </Grid>
        <Grid item xs={6}>
          <Typography component="legend">Energy Level</Typography>
          <Rating value={energyLevel} onChange={(event, newValue) => setEnergyLevel(newValue || 1)} />
        </Grid>
        <Grid item xs={6}>
          <Typography component="legend">Stress Level</Typography>
          <Rating value={stressLevel} onChange={(event, newValue) => setStressLevel(newValue || 1)} />
        </Grid>
        <Grid item xs={6}>
          <Typography component="legend">Motivation</Typography>
          <Rating value={motivation} onChange={(event, newValue) => setMotivation(newValue || 1)} />
        </Grid>
        <Grid item xs={12}>
          <DateTimePicker
            label="Date & Time"
            value={timestamp}
            onChange={(newValue) => setTimestamp(newValue || new Date())}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="How are you feeling today? What's on your mind?"
            multiline
            rows={4}
            value={freeForm}
            onChange={(e) => setFreeForm(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !freeForm.trim()}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Journal Entry'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrackingDialog;