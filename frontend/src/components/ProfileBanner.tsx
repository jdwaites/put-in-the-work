import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip
} from '@mui/material';
import { PersonOutline as PersonIcon } from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

const ProfileBanner: React.FC = () => {
  const { currentProfile } = useProfile();

  return (
    <Paper
      elevation={0}
      sx={{
        background: currentProfile.backgroundColor,
        border: `1px solid ${currentProfile.color}30`,
        borderRadius: 2,
        p: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Avatar
        sx={{
          bgcolor: currentProfile.color,
          color: 'white',
          width: 40,
          height: 40,
          fontSize: '1rem'
        }}
      >
        <PersonIcon />
      </Avatar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: currentProfile.textColor,
            mb: 0.5
          }}
        >
          {currentProfile.name}'s Training Data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All session data and progress tracking
        </Typography>
      </Box>

      <Chip
        label={currentProfile.name}
        avatar={
          <Avatar sx={{ bgcolor: 'white', color: currentProfile.color }}>
            <PersonIcon fontSize="small" />
          </Avatar>
        }
        sx={{
          backgroundColor: currentProfile.color,
          color: 'white',
          fontWeight: 'bold'
        }}
      />
    </Paper>
  );
};

export default ProfileBanner;