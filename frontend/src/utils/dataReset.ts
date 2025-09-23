/**
 * Data Reset Utility for Putting in the Work
 * Provides functions to reset various types of user data
 */

export interface ResetOptions {
  profiles?: boolean;
  workouts?: boolean;
  nutrition?: boolean;
  sleep?: boolean;
  diary?: boolean;
  routines?: boolean;
  goals?: boolean;
  preferences?: boolean;
  all?: boolean;
}

/**
 * Reset all localStorage data for the app
 */
export const resetAllData = (): void => {
  const keys = Object.keys(localStorage);
  const appKeys = keys.filter(key => 
    key.startsWith('putting-in-the-work') || 
    key.includes('fitness') || 
    key.includes('workout') ||
    key.includes('profile') ||
    key.includes('diary') ||
    key.includes('nutrition') ||
    key.includes('sleep')
  );
  
  appKeys.forEach(key => localStorage.removeItem(key));
  
  // Also clear any specific app keys we know about
  const specificKeys = [
    'currentProfile',
    'profileData',
    'workoutHistory',
    'nutritionData',
    'sleepData',
    'diaryEntries',
    'exerciseRoutines',
    'userPreferences',
    'goals',
    'achievements'
  ];
  
  specificKeys.forEach(key => localStorage.removeItem(key));
};

/**
 * Reset specific types of data based on options
 */
export const resetSelectedData = (options: ResetOptions): void => {
  if (options.all) {
    resetAllData();
    return;
  }

  if (options.profiles) {
    localStorage.removeItem('currentProfile');
    localStorage.removeItem('profileData');
  }

  if (options.workouts) {
    localStorage.removeItem('workoutHistory');
    localStorage.removeItem('workoutEntries');
    // Clear workout data for all profiles
    const profiles = ['michael', 'mekhi', 'maya', 'jamal'];
    profiles.forEach(profile => {
      localStorage.removeItem(`${profile}_workouts`);
      localStorage.removeItem(`${profile}_exercises`);
    });
  }

  if (options.nutrition) {
    localStorage.removeItem('nutritionData');
    localStorage.removeItem('mealEntries');
    const profiles = ['michael', 'mekhi', 'maya', 'jamal'];
    profiles.forEach(profile => {
      localStorage.removeItem(`${profile}_nutrition`);
      localStorage.removeItem(`${profile}_meals`);
    });
  }

  if (options.sleep) {
    localStorage.removeItem('sleepData');
    localStorage.removeItem('sleepEntries');
    const profiles = ['michael', 'mekhi', 'maya', 'jamal'];
    profiles.forEach(profile => {
      localStorage.removeItem(`${profile}_sleep`);
    });
  }

  if (options.diary) {
    localStorage.removeItem('diaryEntries');
    const profiles = ['michael', 'mekhi', 'maya', 'jamal'];
    profiles.forEach(profile => {
      localStorage.removeItem(`${profile}_diary`);
    });
  }

  if (options.routines) {
    localStorage.removeItem('exerciseRoutines');
    localStorage.removeItem('customRoutines');
  }

  if (options.goals) {
    localStorage.removeItem('goals');
    localStorage.removeItem('achievements');
    const profiles = ['michael', 'mekhi', 'maya', 'jamal'];
    profiles.forEach(profile => {
      localStorage.removeItem(`${profile}_goals`);
    });
  }

  if (options.preferences) {
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('appSettings');
  }
};

/**
 * Get confirmation before resetting data
 */
export const confirmAndReset = async (
  options: ResetOptions, 
  customMessage?: string
): Promise<boolean> => {
  const message = customMessage || 
    `This will permanently delete ${options.all ? 'ALL' : 'selected'} fitness data. This cannot be undone. Are you sure?`;
  
  const confirmed = window.confirm(message);
  
  if (confirmed) {
    resetSelectedData(options);
    
    // Show success message
    alert('Data has been reset successfully! Please refresh the page to start fresh.');
    
    // Optionally reload the page to ensure clean state
    window.location.reload();
    
    return true;
  }
  
  return false;
};

/**
 * Export data before reset (backup functionality)
 */
export const exportDataBeforeReset = (): string => {
  const allData: Record<string, any> = {};
  
  // Export all localStorage data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        allData[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        allData[key] = localStorage.getItem(key);
      }
    }
  }
  
  const backup = {
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    data: allData
  };
  
  return JSON.stringify(backup, null, 2);
};

/**
 * Download backup file
 */
export const downloadBackup = (): void => {
  const backup = exportDataBeforeReset();
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `fitness-data-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Quick reset functions for different scenarios
 */
export const quickResets = {
  // Reset everything - fresh start
  freshStart: () => confirmAndReset({ all: true }),
  
  // Reset just workout data
  workoutsOnly: () => confirmAndReset({ workouts: true }),
  
  // Reset diary and mood tracking
  diaryOnly: () => confirmAndReset({ diary: true }),
  
  // Reset nutrition tracking
  nutritionOnly: () => confirmAndReset({ nutrition: true }),
  
  // Reset with backup
  resetWithBackup: () => {
    downloadBackup();
    setTimeout(() => confirmAndReset({ all: true }), 1000);
  }
};