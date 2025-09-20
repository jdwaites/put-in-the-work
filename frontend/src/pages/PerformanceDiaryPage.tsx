import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  TrendingUp as TrendIcon,
  EmojiEvents as StreakIcon,
  Insights as InsightIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Mood as MoodIcon,
  FitnessCenter as WorkoutIcon,
  Restaurant as NutritionIcon,
  Bedtime as SleepIcon,
  WaterDrop as HydrationIcon,
  Star as GoalIcon
} from '@mui/icons-material';
import { performanceDiaryService, DiaryEntry, MoodData, PerformanceMetrics, DiaryGoals, DailyReflection, DiaryStats } from '../utils/performanceDiary';

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

const PerformanceDiaryPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<DiaryStats | null>(null);
  const [todayEntry, setTodayEntry] = useState<DiaryEntry | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  
  // Dialog states
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  
  // Entry form data
  const [entryForm, setEntryForm] = useState<Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>>({
    date: new Date().toISOString().split('T')[0],
    mood: {
      energy: 5,
      motivation: 5,
      stress: 5,
      sleep_quality: 5,
      overall_mood: 'neutral'
    },
    performance: {
      workout_intensity: 5,
      workout_satisfaction: 5,
      recovery_level: 5,
      soreness_level: 5,
      nutrition_quality: 5,
      hydration_level: 5
    },
    goals: {
      workout_completed: false,
      nutrition_goal_met: false,
      hydration_goal_met: false,
      sleep_goal_met: false,
      custom_goals: []
    },
    reflection: {
      wins: '',
      challenges: '',
      lessons: '',
      tomorrow_focus: '',
      gratitude: ''
    },
    workout_notes: '',
    nutrition_notes: '',
    general_notes: '',
    tags: [],
    weather: '',
    location: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allEntries = performanceDiaryService.getAllEntries();
    setEntries(allEntries);
    setStats(performanceDiaryService.getDiaryStats());
    setInsights(performanceDiaryService.getMoodInsights());
    
    const today = new Date().toISOString().split('T')[0];
    const todaysEntry = performanceDiaryService.getEntryByDate(today);
    setTodayEntry(todaysEntry);
    
    if (todaysEntry) {
      setEntryForm(todaysEntry);
    }
  };

  const handleSaveEntry = () => {
    try {
      performanceDiaryService.createEntry(entryForm);
      setEntryDialogOpen(false);
      setSnackbar({ open: true, message: 'Diary entry saved successfully!', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save diary entry', severity: 'error' });
    }
  };

  const handleQuickTodayEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    setEntryForm({ ...entryForm, date: today });
    setSelectedDate(today);
    setEntryDialogOpen(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEntryForm(entry);
    setSelectedDate(entry.date);
    setEntryDialogOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      performanceDiaryService.deleteEntry(id);
      loadData();
      setSnackbar({ open: true, message: 'Diary entry deleted', severity: 'success' });
    }
  };

  const handleAddCustomGoal = () => {
    if (customGoal.trim()) {
      setEntryForm({
        ...entryForm,
        goals: {
          ...entryForm.goals,
          custom_goals: [...entryForm.goals.custom_goals, { description: customGoal, completed: false }]
        }
      });
      setCustomGoal('');
    }
  };

  const handleToggleCustomGoal = (index: number) => {
    const updatedGoals = [...entryForm.goals.custom_goals];
    updatedGoals[index].completed = !updatedGoals[index].completed;
    setEntryForm({
      ...entryForm,
      goals: { ...entryForm.goals, custom_goals: updatedGoals }
    });
  };

  const handleRemoveCustomGoal = (index: number) => {
    const updatedGoals = entryForm.goals.custom_goals.filter((_, i) => i !== index);
    setEntryForm({
      ...entryForm,
      goals: { ...entryForm.goals, custom_goals: updatedGoals }
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = performanceDiaryService.searchEntries(searchQuery);
      setEntries(results);
      setSearchDialogOpen(false);
    } else {
      loadData();
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap = {
      'excellent': '😁',
      'good': '😊',
      'neutral': '😐',
      'low': '😔',
      'poor': '😞'
    };
    return moodMap[mood as keyof typeof moodMap] || '😐';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'error';
    if (streak >= 14) return 'warning';
    if (streak >= 7) return 'success';
    return 'primary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📖 Performance Diary
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<TodayIcon />}
            onClick={handleQuickTodayEntry}
            color={todayEntry ? 'success' : 'primary'}
          >
            {todayEntry ? 'Update Today' : 'Log Today'}
          </Button>
          <IconButton onClick={() => setSearchDialogOpen(true)}>
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <StreakIcon color={getStreakColor(stats.current_streak)} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color={`${getStreakColor(stats.current_streak)}.main`}>
                  {stats.current_streak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Streak
                </Typography>
                <Typography variant="caption" display="block">
                  Best: {stats.longest_streak} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MoodIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.average_mood.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Mood
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                  <TrendIcon 
                    color={stats.mood_trend === 'improving' ? 'success' : stats.mood_trend === 'declining' ? 'error' : 'disabled'} 
                    sx={{ fontSize: 16 }} 
                  />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {stats.mood_trend}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <GoalIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.goals_completion_rate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Goals Met
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.goals_completion_rate} 
                  sx={{ mt: 1 }}
                  color="warning"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CalendarIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {stats.total_entries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Entries
                </Typography>
                <Typography variant="caption" display="block">
                  Energy: {stats.average_energy.toFixed(1)}/10
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Recent Entries" />
        <Tab label="Insights" />
        <Tab label="Analytics" />
      </Tabs>

      {/* Recent Entries Tab */}
      <TabPanel value={tabValue} index={0}>
        {entries.length === 0 ? (
          <Alert severity="info" action={
            <Button color="inherit" size="small" onClick={handleQuickTodayEntry}>
              Start First Entry
            </Button>
          }>
            No diary entries yet. Start logging your daily performance to track your fitness journey!
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {entries.slice(0, 10).map((entry) => (
              <Grid item xs={12} key={entry.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6">
                          {formatDate(entry.date)} {getMoodEmoji(entry.mood.overall_mood)}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip label={`Energy: ${entry.mood.energy}/10`} size="small" color="primary" />
                          <Chip label={`Workout: ${entry.performance.workout_intensity}/10`} size="small" color="secondary" />
                          {entry.goals.workout_completed && <Chip label="💪 Workout Done" size="small" color="success" />}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditEntry(entry)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteEntry(entry.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {entry.reflection.wins && (
                      <Box mb={1}>
                        <Typography variant="subtitle2" color="success.main">🏆 Wins:</Typography>
                        <Typography variant="body2">{entry.reflection.wins}</Typography>
                      </Box>
                    )}

                    {entry.reflection.challenges && (
                      <Box mb={1}>
                        <Typography variant="subtitle2" color="warning.main">⚡ Challenges:</Typography>
                        <Typography variant="body2">{entry.reflection.challenges}</Typography>
                      </Box>
                    )}

                    {entry.tags.length > 0 && (
                      <Box display="flex" gap={0.5} mt={2}>
                        {entry.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Insights Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          🧠 Personal Insights
        </Typography>
        {insights.length === 0 ? (
          <Alert severity="info">
            Keep logging daily to unlock personalized insights about your performance patterns!
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {insights.map((insight, index) => (
              <Grid item xs={12} key={index}>
                <Alert severity="info" icon={<InsightIcon />}>
                  {insight}
                </Alert>
              </Grid>
            ))}
          </Grid>
        )}

        {stats && stats.most_common_tags.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              🏷️ Most Used Tags
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {stats.most_common_tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  color="primary" 
                  variant={index === 0 ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          📊 Performance Analytics
        </Typography>
        
        {entries.length >= 3 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Weekly Averages</Typography>
                  {stats && (
                    <List>
                      <ListItem>
                        <ListItemIcon><MoodIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Overall Mood" 
                          secondary={`${stats.average_mood.toFixed(1)}/5 (${stats.mood_trend})`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Energy Level" 
                          secondary={`${stats.average_energy.toFixed(1)}/10`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><GoalIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Goal Completion" 
                          secondary={`${stats.goals_completion_rate}%`}
                        />
                      </ListItem>
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Performance</Typography>
                  {performanceDiaryService.getRecentEntries(7).map((entry, index) => (
                    <Box key={entry.id} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{formatDate(entry.date)}</Typography>
                      <Box>
                        <Chip 
                          label={getMoodEmoji(entry.mood.overall_mood)} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={`${entry.mood.energy}/10`} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            Log at least 3 entries to see detailed analytics and trends!
          </Alert>
        )}
      </TabPanel>

      {/* Entry Dialog */}
      <Dialog open={entryDialogOpen} onClose={() => setEntryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {entryForm.date === new Date().toISOString().split('T')[0] ? 'Today\'s' : 'Daily'} Performance Entry
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Date Selection */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={entryForm.date}
                onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Mood Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>😊 Mood & Energy</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Overall Mood</Typography>
                  <FormControl fullWidth>
                    <Select
                      value={entryForm.mood.overall_mood}
                      onChange={(e) => setEntryForm({
                        ...entryForm,
                        mood: { ...entryForm.mood, overall_mood: e.target.value as any }
                      })}
                    >
                      <MenuItem value="excellent">😁 Excellent</MenuItem>
                      <MenuItem value="good">😊 Good</MenuItem>
                      <MenuItem value="neutral">😐 Neutral</MenuItem>
                      <MenuItem value="low">😔 Low</MenuItem>
                      <MenuItem value="poor">😞 Poor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Energy Level: {entryForm.mood.energy}/10</Typography>
                  <Slider
                    value={entryForm.mood.energy}
                    onChange={(e, newValue) => setEntryForm({
                      ...entryForm,
                      mood: { ...entryForm.mood, energy: newValue as number }
                    })}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Motivation: {entryForm.mood.motivation}/10</Typography>
                  <Slider
                    value={entryForm.mood.motivation}
                    onChange={(e, newValue) => setEntryForm({
                      ...entryForm,
                      mood: { ...entryForm.mood, motivation: newValue as number }
                    })}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Sleep Quality: {entryForm.mood.sleep_quality}/10</Typography>
                  <Slider
                    value={entryForm.mood.sleep_quality}
                    onChange={(e, newValue) => setEntryForm({
                      ...entryForm,
                      mood: { ...entryForm.mood, sleep_quality: newValue as number }
                    })}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Goals Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>🎯 Daily Goals</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entryForm.goals.workout_completed}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          goals: { ...entryForm.goals, workout_completed: e.target.checked }
                        })}
                      />
                    }
                    label="💪 Workout Completed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entryForm.goals.nutrition_goal_met}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          goals: { ...entryForm.goals, nutrition_goal_met: e.target.checked }
                        })}
                      />
                    }
                    label="🥗 Nutrition Goal Met"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entryForm.goals.hydration_goal_met}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          goals: { ...entryForm.goals, hydration_goal_met: e.target.checked }
                        })}
                      />
                    }
                    label="💧 Hydration Goal Met"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entryForm.goals.sleep_goal_met}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          goals: { ...entryForm.goals, sleep_goal_met: e.target.checked }
                        })}
                      />
                    }
                    label="😴 Sleep Goal Met"
                  />
                </Grid>
              </Grid>

              {/* Custom Goals */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Custom Goals</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Add custom goal..."
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGoal()}
                  />
                  <Button size="small" onClick={handleAddCustomGoal} startIcon={<AddIcon />}>
                    Add
                  </Button>
                </Box>
                {entryForm.goals.custom_goals.map((goal, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <Checkbox
                      checked={goal.completed}
                      onChange={() => handleToggleCustomGoal(index)}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {goal.description}
                    </Typography>
                    <IconButton size="small" onClick={() => handleRemoveCustomGoal(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Reflection Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>💭 Daily Reflection</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="🏆 What went well today?"
                    value={entryForm.reflection.wins}
                    onChange={(e) => setEntryForm({
                      ...entryForm,
                      reflection: { ...entryForm.reflection, wins: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="⚡ What was challenging?"
                    value={entryForm.reflection.challenges}
                    onChange={(e) => setEntryForm({
                      ...entryForm,
                      reflection: { ...entryForm.reflection, challenges: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="📚 What did you learn?"
                    value={entryForm.reflection.lessons}
                    onChange={(e) => setEntryForm({
                      ...entryForm,
                      reflection: { ...entryForm.reflection, lessons: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="🙏 What are you grateful for?"
                    value={entryForm.reflection.gratitude}
                    onChange={(e) => setEntryForm({
                      ...entryForm,
                      reflection: { ...entryForm.reflection, gratitude: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Notes Section */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">📝 Additional Notes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="💪 Workout Notes"
                        value={entryForm.workout_notes}
                        onChange={(e) => setEntryForm({ ...entryForm, workout_notes: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="🍎 Nutrition Notes"
                        value={entryForm.nutrition_notes}
                        onChange={(e) => setEntryForm({ ...entryForm, nutrition_notes: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="📋 General Notes"
                        value={entryForm.general_notes}
                        onChange={(e) => setEntryForm({ ...entryForm, general_notes: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEntry} variant="contained" startIcon={<SaveIcon />}>
            Save Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Search Diary Entries</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search in reflections, notes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSearch} variant="contained">Search</Button>
          <Button onClick={() => { setSearchQuery(''); loadData(); setSearchDialogOpen(false); }}>
            Clear
          </Button>
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

export default PerformanceDiaryPage;