import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  Sports as SportsIcon
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

interface SportsSession {
  id: string;
  sport: 'basketball' | 'football';
  category: string;
  subcategory: string;
  duration: number;
  notes: string;
  date: Date;
  quality: number;
}

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

const basketballCategories = {
  'Dribbling': [
    'Basic Ball Handling',
    'Crossover Drills',
    'Between the Legs',
    'Behind the Back',
    'Hesitation Moves',
    'Speed Dribbling',
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
  'Rebounding': [
    'Box Out Technique',
    'Offensive Rebounding',
    'Defensive Rebounding',
    'Outlet Passes',
    'Positioning',
    'Jump Training'
  ],
  'Conditioning': [
    'Suicides/Line Drills',
    'Sprint Intervals',
    'Agility Ladder',
    'Plyometrics',
    'Endurance Running',
    'Basketball Specific'
  ],
  'Passing': [
    'Chest Pass',
    'Bounce Pass',
    'Overhead Pass',
    'Outlet Passing',
    'Entry Passes',
    'Skip Passes',
    'No-Look Passes'
  ],
  'Move Development': [
    'Jab Steps',
    'Triple Threat',
    'Pivot Moves',
    'Drive Moves',
    'Post Moves',
    'Footwork Drills'
  ],
  'Strategy': [
    'Play Study',
    'Film Review',
    'Mental Preparation',
    'Game Situations',
    'Decision Making'
  ],
  'Recovery': [
    'Stretching',
    'Foam Rolling',
    'Ice Bath',
    'Rest',
    'Nutrition Focus',
    'Sleep'
  ]
};

const footballCategories = {
  'Catching': [
    'Basic Catching',
    'Hand-Eye Coordination',
    'Concentration Drills',
    'Contested Catches',
    'One-Handed Catches',
    'Body Catches',
    'Over the Shoulder',
    'Sideline Catches'
  ],
  'Route Running': [
    'Basic Routes',
    'Comeback Routes',
    'Out Routes',
    'In Routes',
    'Post Routes',
    'Go Routes',
    'Option Routes',
    'Timing Routes'
  ],
  'Defense': [
    'Tackle Technique',
    'Coverage Skills',
    'Pass Rush',
    'Run Stopping',
    'Backpedal',
    'Press Coverage',
    'Zone Coverage',
    'Man Coverage'
  ],
  'Conditioning': [
    'Sprint Training',
    '40-Yard Dashes',
    'Agility Drills',
    'Strength Training',
    'Endurance Work',
    'Position Specific'
  ],
  'Blocking': [
    'Pass Protection',
    'Run Blocking',
    'Stance and Start',
    'Hand Placement',
    'Footwork',
    'Combo Blocks'
  ],
  'Ball Skills': [
    'Ball Security',
    'Handoffs',
    'Pitch/Toss',
    'Fumble Recovery',
    'Strip Drills'
  ],
  'Special Teams': [
    'Kicking',
    'Punting',
    'Return Skills',
    'Coverage',
    'Snapping'
  ],
  'Strategy': [
    'Playbook Study',
    'Film Review',
    'Situational Awareness',
    'Mental Preparation'
  ],
  'Recovery': [
    'Stretching',
    'Foam Rolling',
    'Ice Bath',
    'Rest',
    'Nutrition Focus',
    'Injury Prevention'
  ]
};

const SportsTrainingPage: React.FC = () => {
  const { currentProfile, getProfileData, setProfileData } = useProfile();
  const [sessions, setSessions] = useState<SportsSession[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'basketball' | 'football'>('basketball');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [quality, setQuality] = useState(5);

  // Load profile-specific sessions on component mount and when profile changes
  useEffect(() => {
    const savedSessions = getProfileData('sportsSessions');
    if (savedSessions) {
      setSessions(savedSessions);
    } else {
      setSessions([]);
    }
  }, [currentProfile.id]);

  // Save sessions to profile-specific storage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      setProfileData('sportsSessions', sessions);
    }
  }, [sessions, currentProfile.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSportChange = (sport: 'basketball' | 'football') => {
    setSelectedSport(sport);
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
  };

  const createSession = () => {
    if (selectedSport && selectedCategory && selectedSubcategory && duration) {
      const newSession: SportsSession = {
        id: Date.now().toString(),
        sport: selectedSport,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        duration: parseInt(duration),
        notes,
        date: new Date(),
        quality
      };
      setSessions([...sessions, newSession]);
      
      setSelectedCategory('');
      setSelectedSubcategory('');
      setDuration('');
      setNotes('');
      setQuality(5);
      setOpenDialog(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter((session: SportsSession) => session.id !== id));
  };

  const getSessionsByTab = () => {
    if (currentTab === 0) return sessions.filter((s: SportsSession) => s.sport === 'basketball');
    if (currentTab === 1) return sessions.filter((s: SportsSession) => s.sport === 'football');
    return sessions;
  };

  const getTotalTime = (sport?: 'basketball' | 'football') => {
    const filteredSessions = sport ? sessions.filter((s: SportsSession) => s.sport === sport) : sessions;
    return filteredSessions.reduce((total: number, session: SportsSession) => total + session.duration, 0);
  };

  const getCategories = () => {
    return selectedSport === 'basketball' ? basketballCategories : footballCategories;
  };

  const getSubcategories = () => {
    const categories = getCategories();
    return selectedCategory ? categories[selectedCategory as keyof typeof categories] || [] : [];
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sports Training
        </Typography>
        <Fab color="primary" onClick={() => setOpenDialog(true)}>
          <AddIcon />
        </Fab>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            icon={<BasketballIcon />} 
            label={`Basketball (${getTotalTime('basketball')} min)`} 
          />
          <Tab 
            icon={<FootballIcon />} 
            label={`Football (${getTotalTime('football')} min)`} 
          />
          <Tab 
            icon={<SportsIcon />} 
            label={`All (${getTotalTime()} min)`} 
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {getSessionsByTab().length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <BasketballIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No basketball sessions logged yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedSport('basketball');
                  setOpenDialog(true);
                }}
                sx={{ mt: 2 }}
              >
                Start Training
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {getSessionsByTab().map((session: SportsSession) => (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{session.category}</Typography>
                      <IconButton onClick={() => deleteSession(session.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {session.subcategory}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Duration: {session.duration} minutes
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">Quality: {session.quality}/10</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={session.quality * 10} 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    {session.notes && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Notes: {session.notes}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {new Date(session.date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {getSessionsByTab().length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <FootballIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No football sessions logged yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedSport('football');
                  setOpenDialog(true);
                }}
                sx={{ mt: 2 }}
              >
                Start Training
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {getSessionsByTab().map((session: SportsSession) => (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{session.category}</Typography>
                      <IconButton onClick={() => deleteSession(session.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {session.subcategory}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Duration: {session.duration} minutes
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">Quality: {session.quality}/10</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={session.quality * 10} 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    {session.notes && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Notes: {session.notes}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {new Date(session.date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={2}>
          {sessions.map((session: SportsSession) => (
            <Grid item xs={12} md={6} key={session.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {session.sport === 'basketball' ? <BasketballIcon /> : <FootballIcon />}
                      <Typography variant="h6">{session.category}</Typography>
                    </Box>
                    <IconButton onClick={() => deleteSession(session.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {session.subcategory}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Duration: {session.duration} minutes
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">Quality: {session.quality}/10</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={session.quality * 10} 
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  {session.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Notes: {session.notes}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(session.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Training Session</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                onChange={(e: any) => handleSportChange(e.target.value as 'basketball' | 'football')}
              >
                <MenuItem value="basketball">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BasketballIcon />
                    Basketball
                  </Box>
                </MenuItem>
                <MenuItem value="football">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FootballIcon />
                    Football
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e: any) => handleCategoryChange(e.target.value)}
                disabled={!selectedSport}
              >
                {Object.keys(getCategories()).map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Specific Drill/Activity</InputLabel>
              <Select
                value={selectedSubcategory}
                onChange={(e: any) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                {getSubcategories().map(subcategory => (
                  <MenuItem key={subcategory} value={subcategory}>{subcategory}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e: any) => setDuration(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Quality (1-10)</InputLabel>
              <Select
                value={quality}
                onChange={(e: any) => setQuality(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <MenuItem key={num} value={num}>{num}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
              placeholder="How did it go? What to work on next time?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={createSession}
            disabled={!selectedSport || !selectedCategory || !selectedSubcategory || !duration}
            variant="contained"
          >
            Log Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SportsTrainingPage;