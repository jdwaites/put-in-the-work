import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendIcon,
  EmojiEvents as AchievementIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  FitnessCenter as WorkoutIcon,
  Timeline as AnalyticsIcon,
  Star as StarIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: any;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <div style={{ padding: 24 }}>
          {children}
        </div>
      )}
    </div>
  );
}

const AnalyzerPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [timeRange, setTimeRange] = useState('last30');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Mock data for demonstration
  const sportsStats = {
    basketball: {
      totalSessions: 15,
      totalMinutes: 450,
      averageQuality: 7.2,
      improvement: '+15%',
      favoriteSkill: 'Shooting',
      weeklyProgress: [6, 7, 8, 7, 9, 8, 7]
    },
    football: {
      totalSessions: 12,
      totalMinutes: 380,
      averageQuality: 6.8,
      improvement: '+22%',
      favoriteSkill: 'Route Running',
      weeklyProgress: [5, 6, 7, 6, 8, 9, 7]
    }
  };

  const achievements = [
    { title: '7-Day Streak', description: 'Trained for 7 consecutive days', icon: StarIcon, achieved: true },
    { title: 'Quality Master', description: 'Achieved 5 sessions with 9+ quality rating', icon: AchievementIcon, achieved: true },
    { title: '100 Sessions', description: 'Complete 100 training sessions', icon: TrendIcon, achieved: false },
    { title: 'Skill Specialist', description: 'Master all skills in one sport', icon: WorkoutIcon, achieved: false }
  ];

  const skillAnalysis = [
    { skill: 'Basketball Shooting', sessions: 8, avgQuality: 8.1, trend: 'up' },
    { skill: 'Basketball Dribbling', sessions: 6, avgQuality: 7.5, trend: 'up' },
    { skill: 'Football Catching', sessions: 7, avgQuality: 7.8, trend: 'stable' },
    { skill: 'Football Route Running', sessions: 5, avgQuality: 6.9, trend: 'up' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Performance Analyzer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Analyze your training progress, track improvements, and identify areas for growth
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="last7">Last 7 Days</MenuItem>
            <MenuItem value="last30">Last 30 Days</MenuItem>
            <MenuItem value="last90">Last 90 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab icon={<AnalyticsIcon />} label="Overview" />
          <Tab icon={<BasketballIcon />} label="Basketball" />
          <Tab icon={<FootballIcon />} label="Football" />
          <Tab icon={<AchievementIcon />} label="Achievements" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Training Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions: <strong>27</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Time: <strong>830 minutes</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Quality: <strong>7.0/10</strong>
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={70} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  70% toward monthly goal
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Performance Trends
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label="Quality: +18%" 
                    color="success" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip 
                    label="Consistency: +25%" 
                    color="success" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip 
                    label="Duration: +12%" 
                    color="success" 
                    size="small" 
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Alert severity="success" sx={{ mt: 2 }}>
                  Great progress! You're improving consistently across all metrics.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Skill Analysis
                </Typography>
                <List>
                  {skillAnalysis.map((skill, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TrendIcon color={skill.trend === 'up' ? 'success' : 'inherit'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={skill.skill}
                        secondary={`${skill.sessions} sessions • Avg Quality: ${skill.avgQuality}/10`}
                      />
                      <Chip
                        label={skill.trend === 'up' ? 'Improving' : 'Stable'}
                        color={skill.trend === 'up' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BasketballIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Basketball Stats
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {sportsStats.basketball.totalSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  Total Time: <strong>{sportsStats.basketball.totalMinutes} min</strong>
                </Typography>
                <Typography variant="body2">
                  Avg Quality: <strong>{sportsStats.basketball.averageQuality}/10</strong>
                </Typography>
                <Typography variant="body2">
                  Improvement: <strong style={{ color: 'green' }}>{sportsStats.basketball.improvement}</strong>
                </Typography>
                <Typography variant="body2">
                  Favorite Skill: <strong>{sportsStats.basketball.favoriteSkill}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 100 }}>
                  {sportsStats.basketball.weeklyProgress.map((value, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 20,
                        height: `${value * 10}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 1
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Daily quality scores (last 7 days)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <FootballIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Football Stats
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {sportsStats.football.totalSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  Total Time: <strong>{sportsStats.football.totalMinutes} min</strong>
                </Typography>
                <Typography variant="body2">
                  Avg Quality: <strong>{sportsStats.football.averageQuality}/10</strong>
                </Typography>
                <Typography variant="body2">
                  Improvement: <strong style={{ color: 'green' }}>{sportsStats.football.improvement}</strong>
                </Typography>
                <Typography variant="body2">
                  Favorite Skill: <strong>{sportsStats.football.favoriteSkill}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 100 }}>
                  {sportsStats.football.weeklyProgress.map((value, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 20,
                        height: `${value * 10}%`,
                        bgcolor: 'secondary.main',
                        borderRadius: 1
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Daily quality scores (last 7 days)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Grid container spacing={3}>
          {achievements.map((achievement, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ 
                opacity: achievement.achieved ? 1 : 0.6,
                border: achievement.achieved ? '2px solid gold' : 'none'
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <achievement.icon 
                    sx={{ 
                      fontSize: 48, 
                      color: achievement.achieved ? 'gold' : 'text.secondary',
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    {achievement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.description}
                  </Typography>
                  {achievement.achieved && (
                    <Chip 
                      label="ACHIEVED" 
                      color="success" 
                      size="small" 
                      sx={{ mt: 2 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AnalyzerPage;
