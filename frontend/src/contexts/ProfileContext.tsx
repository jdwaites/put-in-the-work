import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Profile {
  id: string;
  name: string;
  color: string;
  backgroundColor: string;
  textColor: string;
  isProtected?: boolean;
  pin?: string;
}

interface ProfileContextType {
  currentProfile: Profile;
  profiles: Profile[];
  switchProfile: (profileId: string, pin?: string) => Promise<boolean>;
  getProfileData: (key: string) => any;
  setProfileData: (key: string, data: any) => void;
  isProfileLocked: (profileId: string) => boolean;
}

// Define family profiles with subtle, professional visual identities
export const PROFILES: Profile[] = [
  {
    id: 'michael',
    name: 'Ike',
    color: '#1976D2', // Professional blue
    backgroundColor: 'rgba(25, 118, 210, 0.04)',
    textColor: '#1565C0'
  },
  {
    id: 'mekhi',
    name: 'Khi',
    color: '#F57C00', // Professional orange
    backgroundColor: 'rgba(245, 124, 0, 0.04)',
    textColor: '#E65100'
  },
  {
    id: 'adrienne',
    name: 'Age',
    color: '#7B1FA2', // Professional purple
    backgroundColor: 'rgba(123, 31, 162, 0.04)',
    textColor: '#6A1B9A'
  },
  {
    id: 'jamal',
    name: 'Mal',
    color: '#388E3C', // Professional green
    backgroundColor: 'rgba(56, 142, 60, 0.04)',
    textColor: '#2E7D32',
    isProtected: true,
    pin: '2580' // PIN protected profile
  }
];

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<Profile>(PROFILES[0]); // Default to Ike

  // Load saved profile on startup
  useEffect(() => {
    const savedProfileId = localStorage.getItem('currentProfileId');
    if (savedProfileId) {
      const profile = PROFILES.find(p => p.id === savedProfileId);
      if (profile) {
        setCurrentProfile(profile);
      }
    }
  }, []);

  const switchProfile = async (profileId: string, pin?: string): Promise<boolean> => {
    const profile = PROFILES.find(p => p.id === profileId);
    if (!profile) {
      return false;
    }

    // Check if profile is protected
    if (profile.isProtected && profile.pin) {
      if (!pin || pin !== profile.pin) {
        return false; // Authentication failed
      }
    }

    setCurrentProfile(profile);
    localStorage.setItem('currentProfileId', profileId);
    return true;
  };

  const isProfileLocked = (profileId: string): boolean => {
    const profile = PROFILES.find(p => p.id === profileId);
    return profile?.isProtected === true;
  };

  // Get profile-specific data from localStorage
  const getProfileData = (key: string) => {
    const profileKey = `${currentProfile.id}_${key}`;
    const data = localStorage.getItem(profileKey);
    return data ? JSON.parse(data) : null;
  };

  // Set profile-specific data to localStorage
  const setProfileData = (key: string, data: any) => {
    const profileKey = `${currentProfile.id}_${key}`;
    localStorage.setItem(profileKey, JSON.stringify(data));
  };

  return (
    <ProfileContext.Provider value={{
      currentProfile,
      profiles: PROFILES,
      switchProfile,
      getProfileData,
      setProfileData,
      isProfileLocked
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};