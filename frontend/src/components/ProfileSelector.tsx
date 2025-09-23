import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  PersonOutline as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

const ProfileSelector: React.FC = () => {
  const { currentProfile, profiles, switchProfile, isProfileLocked } = useProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileSelect = async (profileId: string) => {
    if (isProfileLocked(profileId)) {
      setSelectedProfileId(profileId);
      setPinDialogOpen(true);
      handleClose();
    } else {
      const success = await switchProfile(profileId);
      if (success) {
        handleClose();
      }
    }
  };

  const handlePinSubmit = async () => {
    const success = await switchProfile(selectedProfileId, pin);
    if (success) {
      setPinDialogOpen(false);
      setPin('');
      setPinError('');
    } else {
      setPinError('Invalid PIN. Access denied.');
      setPin('');
    }
  };

  const handlePinKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handlePinSubmit();
    }
  };

  const handlePinDialogClose = () => {
    setPinDialogOpen(false);
    setPin('');
    setPinError('');
    setSelectedProfileId('');
  };

  return (
    <Box>
      <Button
        onClick={handleClick}
        variant="outlined"
        sx={{
          borderColor: currentProfile.color,
          color: currentProfile.textColor,
          fontWeight: 'bold',
          borderRadius: 2,
          px: 3,
          py: 1,
          borderWidth: 2,
          '&:hover': {
            borderColor: currentProfile.color,
            backgroundColor: currentProfile.backgroundColor,
            borderWidth: 2
          },
          transition: 'all 0.2s ease'
        }}
        endIcon={<ArrowDownIcon />}
        startIcon={
          <Avatar
            sx={{
              bgcolor: currentProfile.color,
              color: 'white',
              width: 24,
              height: 24,
              fontSize: '0.8rem'
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
        }
      >
        <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
          {currentProfile.name}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: 250
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Switch Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose whose data you want to view and track
          </Typography>
        </Box>
        
        <Divider />
        
        {profiles.map((profile) => (
          <MenuItem
            key={profile.id}
            onClick={() => handleProfileSelect(profile.id)}
            selected={profile.id === currentProfile.id}
            sx={{
              px: 2,
              py: 1.5,
              backgroundColor: profile.id === currentProfile.id ? profile.backgroundColor : 'transparent',
              '&:hover': {
                backgroundColor: profile.backgroundColor,
              },
              borderLeft: profile.id === currentProfile.id ? `3px solid ${profile.color}` : '3px solid transparent',
            }}
          >
            <Avatar
              sx={{
                bgcolor: profile.color,
                color: 'white',
                width: 32,
                height: 32,
                mr: 2,
                fontSize: '0.9rem'
              }}
            >
              <PersonIcon />
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: profile.id === currentProfile.id ? 'bold' : 'normal',
                  color: profile.id === currentProfile.id ? profile.textColor : 'inherit'
                }}
              >
                {profile.name}
                {isProfileLocked(profile.id) && (
                  <LockIcon sx={{ ml: 1, fontSize: 16, opacity: 0.7 }} />
                )}
              </Typography>
            </Box>

            {profile.id === currentProfile.id && (
              <Chip
                label="Active"
                size="small"
                sx={{
                  backgroundColor: profile.color,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            )}
            
            {isProfileLocked(profile.id) && profile.id !== currentProfile.id && (
              <Chip
                label="Protected"
                size="small"
                icon={<LockIcon />}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* PIN Authentication Dialog */}
      <Dialog 
        open={pinDialogOpen} 
        onClose={handlePinDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <LockIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
          <Typography variant="h5" component="div">
            Profile Protected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profiles.find(p => p.id === selectedProfileId)?.name}'s profile requires a PIN
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter PIN"
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={handlePinKeyPress}
            error={!!pinError}
            helperText={pinError}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPin(!showPin)}
                    edge="end"
                  >
                    {showPin ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handlePinDialogClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePinSubmit}
            startIcon={<LockIcon />}
          >
            Unlock Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSelector;