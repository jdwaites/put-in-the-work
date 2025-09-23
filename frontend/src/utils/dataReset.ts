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
export const resetAllData = (): Promise<boolean> => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    return Promise.resolve(true);
  } catch (error) {
    console.error('Error resetting all data:', error);
    return Promise.resolve(false);
  }
};

/**
 * Reset selected data based on options
 */
export const resetSelectedData = async (options: ResetOptions): Promise<boolean> => {
  try {
    if (options.all) {
      return await resetAllData();
    }

    // Reset specific data types
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (options.profiles && key.includes('profile')) {
        localStorage.removeItem(key);
      }
      if (options.workouts && (key.includes('workout') || key.includes('exercise'))) {
        localStorage.removeItem(key);
      }
      if (options.nutrition && (key.includes('nutrition') || key.includes('meal'))) {
        localStorage.removeItem(key);
      }
      if (options.sleep && key.includes('sleep')) {
        localStorage.removeItem(key);
      }
      if (options.diary && key.includes('diary')) {
        localStorage.removeItem(key);
      }
      if (options.routines && key.includes('routine')) {
        localStorage.removeItem(key);
      }
      if (options.goals && key.includes('goal')) {
        localStorage.removeItem(key);
      }
      if (options.preferences && (key.includes('preference') || key.includes('setting'))) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error('Error resetting selected data:', error);
    return false;
  }
};

/**
 * Export data before reset (creates downloadable backup)
 */
export const exportDataBeforeReset = async (): Promise<void> => {
  try {
    const data: Record<string, string> = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      data[key] = localStorage.getItem(key) || '';
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

/**
 * Download backup of current data
 */
export const downloadBackup = async (): Promise<void> => {
  await exportDataBeforeReset();
};

/**
 * Quick reset functions for common scenarios
 */
export const quickResets = {
  freshStart: async (): Promise<void> => {
    const confirmed = window.confirm('Reset all data? This cannot be undone.');
    if (confirmed) {
      await resetAllData();
      window.location.reload();
    }
  },
  
  clearWorkouts: async (): Promise<void> => {
    const confirmed = window.confirm('Clear all workout data? This cannot be undone.');
    if (confirmed) {
      await resetSelectedData({ workouts: true });
      window.location.reload();
    }
  },
  
  clearProfiles: async (): Promise<void> => {
    const confirmed = window.confirm('Clear all profile data? This cannot be undone.');
    if (confirmed) {
      await resetSelectedData({ profiles: true });
      window.location.reload();
    }
  }
};