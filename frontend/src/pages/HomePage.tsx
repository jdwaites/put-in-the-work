import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Container,
  Paper,
  IconButton,
  Fade
} from '@mui/material';
import {
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  FitnessCenter as WorkoutIcon,
  TrendingUp as ProgressIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

interface HomePageProps {
  onPageChange: (page: string) => void;
}

// Inspirational quotes for sports training
const inspirationalQuotes = [
  {
    text: "Champions are made when nobody's watching.",
    author: "Unknown",
    category: "dedication"
  },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
    category: "effort"
  },
  {
    text: "The only way to prove that you're a good sport is to lose.",
    author: "Ernie Banks",
    category: "character"
  },
  {
    text: "Success is where preparation and opportunity meet.",
    author: "Bobby Unser",
    category: "preparation"
  },
  {
    text: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    category: "courage"
  },
  {
    text: "It's not whether you get knocked down; it's whether you get up.",
    author: "Vince Lombardi",
    category: "resilience"
  },
  {
    text: "The difference between ordinary and extraordinary is that little extra.",
    author: "Jimmy Johnson",
    category: "excellence"
  },
  {
    text: "Don't let what you cannot do interfere with what you can do.",
    author: "John Wooden",
    category: "focus"
  },
  {
    text: "Excellence is not a skill, it's an attitude.",
    author: "Ralph Marston",
    category: "mindset"
  },
  {
    text: "The will to win, the desire to succeed, the urge to reach your full potential... these are the keys that will unlock the door to personal excellence.",
    author: "Confucius",
    category: "motivation"
  }
];

const HomePage: React.FC<HomePageProps> = ({ onPageChange }) => {
  const { currentProfile, getProfileData } = useProfile();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [fade, setFade] = useState(true);

  // Get profile-specific greeting
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    return `${timeGreeting}, ${currentProfile.name}`;
  };

  // Get profile-specific stats
  const getProfileStats = () => {
    const sessions = getProfileData('sportsSessions') || [];
    const totalSessions = sessions.length;
    const thisWeekSessions = sessions.filter((s: any) => {
      const sessionDate = new Date(s.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length;

    return { totalSessions, thisWeekSessions };
  };

  const stats = getProfileStats();

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
        setFade(true);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleQuoteRefresh = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
      setFade(true);
    }, 300);
  };

  const quickStats = [
    { label: 'Basketball Sessions', value: '12', color: '#ff9800' },
    { label: 'Football Sessions', value: '8', color: '#4caf50' },
    { label: 'This Week', value: '5', color: '#2196f3' },
    { label: 'Goals Achieved', value: '3', color: '#9c27b0' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section with Quote */}
      <Paper
        elevation={3}
        sx={{
          background: `linear-gradient(135deg, ${currentProfile.color}20 0%, ${currentProfile.color}40 100%)`,
          border: `2px solid ${currentProfile.color}`,
          color: currentProfile.textColor,
          p: 4,
          mb: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" gutterBottom fontWeight="bold" textAlign="center">
            {getPersonalizedGreeting()}
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 3, opacity: 0.8 }}>
            Track, Train, and Transform Your Athletic Performance
          </Typography>
          
          {/* Profile Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
            <Chip
              label={`${stats.totalSessions} Total Sessions`}
              sx={{ backgroundColor: 'white', color: currentProfile.textColor, fontWeight: 'bold' }}
            />
            <Chip
              label={`${stats.thisWeekSessions} This Week`}
              sx={{ backgroundColor: 'white', color: currentProfile.textColor, fontWeight: 'bold' }}
            />
          </Box>
          
          {/* Inspirational Quote Section */}
          <Fade in={fade} timeout={500}>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 2 }}>
                "{inspirationalQuotes[currentQuote].text}"
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  — {inspirationalQuotes[currentQuote].author}
                </Typography>
                <Chip 
                  label={inspirationalQuotes[currentQuote].category} 
                  size="small" 
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <IconButton 
                  onClick={handleQuoteRefresh}
                  sx={{ color: 'white', opacity: 0.7 }}
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>
          </Fade>
        </Box>
        
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            opacity: 0.1,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Card elevation={2} sx={{ textAlign: 'center', py: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Family Photo Section - Your Sports Journey */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center">
          Our Athletic Journey
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Capturing moments of growth, dedication, and achievement
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <img 
                src="/images/20240608_124613.jpg" 
                alt="Sports training moment"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <img 
                src="/images/20240708_103304.jpg" 
                alt="Athletic development"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <img 
                src="/images/20240802_110842.jpg" 
                alt="Training progress"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <img 
                src="/images/20241012_181950.jpg" 
                alt="Athletic achievement"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Grid>
        </Grid>
        
        {/* Additional Photos Carousel */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            More Training Memories
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/20240709_123150.jpg" 
                  alt="Training session"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/20241014_140322.jpg" 
                  alt="Athletic progress"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/IMG_20240609_225951_184.jpg" 
                  alt="Sports moment"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/IMG_20240609_230238_932.jpg" 
                  alt="Training dedication"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/T15A-20230202105151a-1.jpg" 
                  alt="Athletic achievement"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={4} md={2}>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.03)' }
                }}
              >
                <img 
                  src="/images/20250531_154530(1)(1).jpg" 
                  alt="Sports excellence"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center">
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => onPageChange('sports')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <BasketballIcon sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Start Basketball Training
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Practice dribbling, shooting, and defensive skills
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PlayIcon />}
                sx={{ backgroundColor: '#ff9800' }}
              >
                Begin Session
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => onPageChange('sports')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <FootballIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Start Football Training
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Work on catching, routes, and conditioning
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PlayIcon />}
                sx={{ backgroundColor: '#4caf50' }}
              >
                Begin Session
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => onPageChange('analyzer')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ProgressIcon sx={{ fontSize: 60, color: '#2196f3', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                View Progress
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Analyze performance and track improvements
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<StarIcon />}
                sx={{ backgroundColor: '#2196f3' }}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => onPageChange('reporter')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <WorkoutIcon sx={{ fontSize: 60, color: '#9c27b0', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Generate Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create detailed training progress reports
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<WorkoutIcon />}
                sx={{ backgroundColor: '#9c27b0' }}
              >
                Create Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;