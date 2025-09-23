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
import { useProfile } from '../contexts/ProfileContext';

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
  const { getProfileData } = useProfile();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Calculate real stats from profile data
  const calculateSportsStats = () => {
    const sessions = getProfileData('sportsSessions') || [];
    
    const basketballSessions = sessions.filter((s: any) => s.sport === 'basketball');
    const footballSessions = sessions.filter((s: any) => s.sport === 'football');

    const calculateStats = (sportSessions: any[]) => {
      if (sportSessions.length === 0) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          averageQuality: 0,
          improvement: '0%',
          favoriteSkill: 'None',
          weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
        };
      }

      const totalMinutes = sportSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const avgQuality = sportSessions.reduce((sum, s) => sum + (s.quality || 0), 0) / sportSessions.length;
      
      // Calculate skill frequency
      const skillCounts: { [key: string]: number } = {};
      sportSessions.forEach(s => {
        if (s.skills && Array.isArray(s.skills)) {
          s.skills.forEach((skill: string) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });
      
      const favoriteSkill = Object.keys(skillCounts).length > 0 
        ? Object.entries(skillCounts).sort(([,a], [,b]) => b - a)[0][0]
        : 'Various Skills';

      // Calculate weekly progress (last 7 days)
      const weeklyProgress = Array(7).fill(0);
      const today = new Date();
      sportSessions.forEach(s => {
        const sessionDate = new Date(s.date);
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          weeklyProgress[6 - daysDiff] = s.quality || 0;
        }
      });

      // Simple improvement calculation based on recent vs older sessions
      const recentSessions = sportSessions.slice(-5);
      const olderSessions = sportSessions.slice(0, -5);
      let improvement = '0%';
      if (olderSessions.length > 0 && recentSessions.length > 0) {
        const recentAvg = recentSessions.reduce((sum, s) => sum + (s.quality || 0), 0) / recentSessions.length;
        const olderAvg = olderSessions.reduce((sum, s) => sum + (s.quality || 0), 0) / olderSessions.length;
        const improvementPercent = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(0);
        improvement = `${improvementPercent > 0 ? '+' : ''}${improvementPercent}%`;
      }

      return {
        totalSessions: sportSessions.length,
        totalMinutes,
        averageQuality: Math.round(avgQuality * 10) / 10,
        improvement,
        favoriteSkill,
        weeklyProgress
      };
    };

    return {
      basketball: calculateStats(basketballSessions),
      football: calculateStats(footballSessions)
    };
  };

  const sportsStats = calculateSportsStats();

  // Calculate real achievements
  const calculateAchievements = () => {
    const sessions = getProfileData('sportsSessions') || [];
    const totalSessions = sessions.length;
    
    // Check for 7-day streak
    const today = new Date();
    let consecutiveDays = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasSessionOnDate = sessions.some((s: any) => {
        const sessionDate = new Date(s.date);
        return sessionDate.toDateString() === checkDate.toDateString();
      });
      if (hasSessionOnDate) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    // Check for quality sessions
    const highQualitySessions = sessions.filter((s: any) => (s.quality || 0) >= 9).length;

    return [
      { 
        title: '7-Day Streak', 
        description: 'Trained for 7 consecutive days', 
        icon: StarIcon, 
        achieved: consecutiveDays >= 7 
      },
      { 
        title: 'Quality Master', 
        description: 'Achieved 5 sessions with 9+ quality rating', 
        icon: AchievementIcon, 
        achieved: highQualitySessions >= 5 
      },
      { 
        title: '100 Sessions', 
        description: 'Complete 100 training sessions', 
        icon: TrendIcon, 
        achieved: totalSessions >= 100 
      },
      { 
        title: 'Skill Specialist', 
        description: 'Master all skills in one sport', 
        icon: WorkoutIcon, 
        achieved: false // This would need more complex logic
      }
    ];
  };

  const achievements = calculateAchievements();

  // Calculate real skill analysis
  const calculateSkillAnalysis = () => {
    const sessions = getProfileData('sportsSessions') || [];
    const skillStats: { [key: string]: { sessions: number; totalQuality: number; qualities: number[] } } = {};

    sessions.forEach((s: any) => {
      if (s.skills && Array.isArray(s.skills)) {
        s.skills.forEach((skill: string) => {
          const fullSkillName = `${s.sport === 'basketball' ? 'Basketball' : 'Football'} ${skill}`;
          if (!skillStats[fullSkillName]) {
            skillStats[fullSkillName] = { sessions: 0, totalQuality: 0, qualities: [] };
          }
          skillStats[fullSkillName].sessions++;
          skillStats[fullSkillName].totalQuality += (s.quality || 0);
          skillStats[fullSkillName].qualities.push(s.quality || 0);
        });
      }
    });

    return Object.entries(skillStats).map(([skill, stats]) => {
      const avgQuality = stats.totalQuality / stats.sessions;
      
      // Calculate trend based on recent vs older sessions
      let trend = 'stable';
      if (stats.qualities.length >= 3) {
        const recent = stats.qualities.slice(-2).reduce((a, b) => a + b, 0) / 2;
        const older = stats.qualities.slice(0, -2).reduce((a, b) => a + b, 0) / (stats.qualities.length - 2);
        if (recent > older + 0.5) trend = 'up';
        else if (recent < older - 0.5) trend = 'down';
      }

      return {
        skill,
        sessions: stats.sessions,
        avgQuality: Math.round(avgQuality * 10) / 10,
        trend
      };
    }).sort((a, b) => b.sessions - a.sessions); // Sort by number of sessions
  };

  const skillAnalysis = calculateSkillAnalysis();

  // Check if we have any data
  const totalSessions = (getProfileData('sportsSessions') || []).length;
  const hasData = totalSessions > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Performance Analyzer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Analyze your training progress, track improvements, and identify areas for growth
      </Typography>

      {!hasData ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No training data available yet. Start logging your basketball and football sessions in the Sports Training page to see your performance analytics here!
        </Alert>
      ) : (
        <>
          {/* Time Range Filter */}
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="last7">Last 7 Days</MenuItem>
                <MenuItem value="last30">Last 30 Days</MenuItem>
                <MenuItem value="last90">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </>
      )}

      {hasData && (
        <>
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
        </>
      )}
    </Box>
  );
};

export default AnalyzerPage;
