// Daily Performance Diary Service
// Manages daily fitness diary entries, mood tracking, and performance reflections

export interface MoodData {
  energy: number; // 1-10 scale
  motivation: number; // 1-10 scale
  stress: number; // 1-10 scale
  sleep_quality: number; // 1-10 scale
  overall_mood: 'excellent' | 'good' | 'neutral' | 'low' | 'poor';
}

export interface PerformanceMetrics {
  workout_intensity: number; // 1-10 scale
  workout_satisfaction: number; // 1-10 scale
  recovery_level: number; // 1-10 scale
  soreness_level: number; // 1-10 scale
  nutrition_quality: number; // 1-10 scale
  hydration_level: number; // 1-10 scale
}

export interface DiaryGoals {
  workout_completed: boolean;
  nutrition_goal_met: boolean;
  hydration_goal_met: boolean;
  sleep_goal_met: boolean;
  custom_goals: {
    description: string;
    completed: boolean;
  }[];
}

export interface DailyReflection {
  wins: string; // What went well today
  challenges: string; // What was difficult
  lessons: string; // What did you learn
  tomorrow_focus: string; // What to focus on tomorrow
  gratitude: string; // What are you grateful for
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  mood: MoodData;
  performance: PerformanceMetrics;
  goals: DiaryGoals;
  reflection: DailyReflection;
  workout_notes?: string;
  nutrition_notes?: string;
  general_notes?: string;
  photos?: string[]; // Base64 encoded images
  tags: string[];
  weather?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface DiaryStats {
  total_entries: number;
  current_streak: number;
  longest_streak: number;
  average_mood: number;
  average_energy: number;
  goals_completion_rate: number;
  most_common_tags: string[];
  mood_trend: 'improving' | 'stable' | 'declining';
}

export class PerformanceDiaryService {
  private storage = {
    get: (key: string, defaultValue: any = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
      }
    },
    set: (key: string, value: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  };

  // Create a new diary entry
  createEntry(entryData: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>): DiaryEntry {
    const entry: DiaryEntry = {
      ...entryData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const entries = this.getAllEntries();
    
    // Check if entry for this date already exists
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = { ...entries[existingIndex], ...entry, id: entries[existingIndex].id };
    } else {
      // Add new entry
      entries.push(entry);
    }

    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.storage.set('diaryEntries', entries);
    return entry;
  }

  // Get all diary entries
  getAllEntries(): DiaryEntry[] {
    return this.storage.get('diaryEntries', []);
  }

  // Get entry by date
  getEntryByDate(date: string): DiaryEntry | null {
    const entries = this.getAllEntries();
    return entries.find(entry => entry.date === date) || null;
  }

  // Get entry by ID
  getEntryById(id: string): DiaryEntry | null {
    const entries = this.getAllEntries();
    return entries.find(entry => entry.id === id) || null;
  }

  // Update existing entry
  updateEntry(id: string, updates: Partial<DiaryEntry>): DiaryEntry | null {
    const entries = this.getAllEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) return null;

    entries[index] = {
      ...entries[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.storage.set('diaryEntries', entries);
    return entries[index];
  }

  // Delete entry
  deleteEntry(id: string): boolean {
    const entries = this.getAllEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    if (filteredEntries.length === entries.length) return false;

    this.storage.set('diaryEntries', filteredEntries);
    return true;
  }

  // Get entries for a specific date range
  getEntriesInRange(startDate: string, endDate: string): DiaryEntry[] {
    const entries = this.getAllEntries();
    return entries.filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  }

  // Get recent entries (last N days)
  getRecentEntries(days: number = 7): DiaryEntry[] {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    return this.getEntriesInRange(startDate, endDate);
  }

  // Search entries by content
  searchEntries(query: string): DiaryEntry[] {
    const entries = this.getAllEntries();
    const lowerQuery = query.toLowerCase();
    
    return entries.filter(entry => 
      entry.reflection.wins.toLowerCase().includes(lowerQuery) ||
      entry.reflection.challenges.toLowerCase().includes(lowerQuery) ||
      entry.reflection.lessons.toLowerCase().includes(lowerQuery) ||
      entry.workout_notes?.toLowerCase().includes(lowerQuery) ||
      entry.nutrition_notes?.toLowerCase().includes(lowerQuery) ||
      entry.general_notes?.toLowerCase().includes(lowerQuery) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get diary statistics
  getDiaryStats(): DiaryStats {
    const entries = this.getAllEntries();
    
    if (entries.length === 0) {
      return {
        total_entries: 0,
        current_streak: 0,
        longest_streak: 0,
        average_mood: 0,
        average_energy: 0,
        goals_completion_rate: 0,
        most_common_tags: [],
        mood_trend: 'stable'
      };
    }

    // Calculate streaks
    const { current_streak, longest_streak } = this.calculateStreaks(entries);

    // Calculate averages
    const moodValues = entries.map(e => this.getMoodNumericValue(e.mood.overall_mood));
    const energyValues = entries.map(e => e.mood.energy);
    
    const average_mood = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    const average_energy = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;

    // Calculate goals completion rate
    const totalGoals = entries.reduce((total, entry) => {
      const basicGoals = [
        entry.goals.workout_completed,
        entry.goals.nutrition_goal_met,
        entry.goals.hydration_goal_met,
        entry.goals.sleep_goal_met
      ].length;
      return total + basicGoals + entry.goals.custom_goals.length;
    }, 0);

    const completedGoals = entries.reduce((total, entry) => {
      const basicCompleted = [
        entry.goals.workout_completed,
        entry.goals.nutrition_goal_met,
        entry.goals.hydration_goal_met,
        entry.goals.sleep_goal_met
      ].filter(Boolean).length;
      
      const customCompleted = entry.goals.custom_goals.filter(goal => goal.completed).length;
      return total + basicCompleted + customCompleted;
    }, 0);

    const goals_completion_rate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Get most common tags
    const tagCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const most_common_tags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate mood trend (last 7 days vs previous 7 days)
    const recent7 = this.getRecentEntries(7);
    const previous7 = this.getEntriesInRange(
      new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    let mood_trend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (recent7.length > 0 && previous7.length > 0) {
      const recentAvg = recent7.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / recent7.length;
      const previousAvg = previous7.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / previous7.length;
      
      if (recentAvg > previousAvg + 0.3) mood_trend = 'improving';
      else if (recentAvg < previousAvg - 0.3) mood_trend = 'declining';
    }

    return {
      total_entries: entries.length,
      current_streak,
      longest_streak,
      average_mood: Math.round(average_mood * 10) / 10,
      average_energy: Math.round(average_energy * 10) / 10,
      goals_completion_rate: Math.round(goals_completion_rate),
      most_common_tags,
      mood_trend
    };
  }

  // Helper function to convert mood to numeric value
  private getMoodNumericValue(mood: string): number {
    const moodMap = {
      'excellent': 5,
      'good': 4,
      'neutral': 3,
      'low': 2,
      'poor': 1
    };
    return moodMap[mood as keyof typeof moodMap] || 3;
  }

  // Calculate diary streaks
  private calculateStreaks(entries: DiaryEntry[]): { current_streak: number; longest_streak: number } {
    if (entries.length === 0) return { current_streak: 0, longest_streak: 0 };

    // Sort entries by date (oldest first for streak calculation)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let current_streak = 0;
    let longest_streak = 0;
    let temp_streak = 1;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if current streak is active (entry today or yesterday)
    const hasRecentEntry = entries.some(entry => entry.date === today || entry.date === yesterday);
    
    if (hasRecentEntry) {
      // Calculate current streak from the end
      const recentEntries = [...entries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let checkDate = new Date(today);
      for (const entry of recentEntries) {
        const entryDate = entry.date;
        const currentCheckDate = checkDate.toISOString().split('T')[0];
        
        if (entryDate === currentCheckDate) {
          current_streak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else if (entryDate < currentCheckDate) {
          // Check if there's a gap of more than 1 day
          const dayDiff = Math.floor((checkDate.getTime() - new Date(entryDate).getTime()) / (24 * 60 * 60 * 1000));
          if (dayDiff > 1) break;
          
          checkDate = new Date(new Date(entryDate).getTime() - 24 * 60 * 60 * 1000);
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i - 1].date);
      const currentDate = new Date(sortedEntries[i].date);
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (dayDiff === 1) {
        temp_streak++;
      } else {
        longest_streak = Math.max(longest_streak, temp_streak);
        temp_streak = 1;
      }
    }
    
    longest_streak = Math.max(longest_streak, temp_streak, current_streak);

    return { current_streak, longest_streak };
  }

  // Get mood insights
  getMoodInsights(): string[] {
    const entries = this.getRecentEntries(30); // Last 30 days
    if (entries.length < 3) return ['Keep logging daily to get personalized insights!'];

    const insights: string[] = [];
    const stats = this.getDiaryStats();

    // Energy patterns
    const morningEntries = entries.filter(e => new Date(e.created_at).getHours() < 12);
    const eveningEntries = entries.filter(e => new Date(e.created_at).getHours() >= 18);
    
    if (morningEntries.length > 0 && eveningEntries.length > 0) {
      const avgMorningEnergy = morningEntries.reduce((sum, e) => sum + e.mood.energy, 0) / morningEntries.length;
      const avgEveningEnergy = eveningEntries.reduce((sum, e) => sum + e.mood.energy, 0) / eveningEntries.length;
      
      if (avgMorningEnergy > avgEveningEnergy + 1) {
        insights.push('💡 You tend to have higher energy in the mornings. Consider scheduling important workouts earlier in the day.');
      } else if (avgEveningEnergy > avgMorningEnergy + 1) {
        insights.push('🌆 Your energy peaks in the evening. Evening workouts might be more effective for you.');
      }
    }

    // Sleep and mood correlation
    const entriesWithSleep = entries.filter(e => e.mood.sleep_quality >= 1);
    if (entriesWithSleep.length >= 5) {
      const goodSleepDays = entriesWithSleep.filter(e => e.mood.sleep_quality >= 7);
      const avgMoodGoodSleep = goodSleepDays.length > 0 
        ? goodSleepDays.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / goodSleepDays.length 
        : 0;
      
      const poorSleepDays = entriesWithSleep.filter(e => e.mood.sleep_quality <= 5);
      const avgMoodPoorSleep = poorSleepDays.length > 0
        ? poorSleepDays.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / poorSleepDays.length
        : 0;

      if (avgMoodGoodSleep > avgMoodPoorSleep + 0.5) {
        insights.push('😴 Your mood significantly improves with better sleep quality. Prioritize 7-8 hours of quality sleep.');
      }
    }

    // Workout completion patterns
    const workoutDays = entries.filter(e => e.goals.workout_completed);
    if (workoutDays.length >= 3) {
      const avgMoodWorkoutDays = workoutDays.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / workoutDays.length;
      const nonWorkoutDays = entries.filter(e => !e.goals.workout_completed);
      
      if (nonWorkoutDays.length > 0) {
        const avgMoodNonWorkoutDays = nonWorkoutDays.reduce((sum, e) => sum + this.getMoodNumericValue(e.mood.overall_mood), 0) / nonWorkoutDays.length;
        
        if (avgMoodWorkoutDays > avgMoodNonWorkoutDays + 0.3) {
          insights.push('🏃‍♂️ Your mood is consistently better on workout days. Regular exercise is clearly benefiting your mental health!');
        }
      }
    }

    // Streak motivation
    if (stats.current_streak >= 7) {
      insights.push(`🔥 Amazing ${stats.current_streak}-day streak! You're building a powerful habit. Keep it up!`);
    } else if (stats.current_streak >= 3) {
      insights.push(`🌟 Great ${stats.current_streak}-day streak! You're on your way to making this a lasting habit.`);
    }

    // Goals completion insight
    if (stats.goals_completion_rate >= 80) {
      insights.push('🎯 Excellent goal achievement rate! You\'re staying consistent with your fitness objectives.');
    } else if (stats.goals_completion_rate <= 50) {
      insights.push('📝 Consider setting smaller, more achievable daily goals to build momentum and confidence.');
    }

    return insights.length > 0 ? insights : ['Keep logging consistently to unlock personalized insights!'];
  }

  // Export diary data for backup
  exportDiaryData(): string {
    const entries = this.getAllEntries();
    const stats = this.getDiaryStats();
    
    return JSON.stringify({
      export_date: new Date().toISOString(),
      entries,
      stats,
      version: '1.0'
    }, null, 2);
  }

  // Import diary data from backup
  importDiaryData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.entries && Array.isArray(data.entries)) {
        this.storage.set('diaryEntries', data.entries);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing diary data:', error);
      return false;
    }
  }
}

export const performanceDiaryService = new PerformanceDiaryService();