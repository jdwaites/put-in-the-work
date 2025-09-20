export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: 'admin' | 'member';
  preferences: {
    units: 'metric' | 'imperial';
    timezone: string;
    notifications: {
      dailyReminder: boolean;
      weeklyReport: boolean;
      goalAchievements: boolean;
    };
  };
  goals: {
    weightTarget?: number;
    dailyCalories?: number;
    dailyProtein?: number;
    dailyWater?: number;
    weeklyWorkouts?: number;
    dailySleep?: number;
    dailyMeditation?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  unit: 'kg' | 'lbs';
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
  timestamp: Date;
}

export interface SleepEntry {
  id: string;
  userId: string;
  bedTime: Date;
  wakeTime: Date;
  duration: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5; // 1-5 rating
  restfulness: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  timestamp: Date;
}

export interface MealEntry {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterIntake: number; // ml
  notes?: string;
  timestamp: Date;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  name: string;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high' | 'very-high';
  exercises: Exercise[];
  caloriesBurned?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  notes?: string;
  timestamp: Date;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number; // minutes for cardio
  distance?: number; // km or miles
  restTime?: number; // seconds
}

export interface MeditationEntry {
  id: string;
  userId: string;
  type: 'mindfulness' | 'breathing' | 'guided' | 'movement' | 'other';
  duration: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5;
  focus: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  timestamp: Date;
}

export interface ThinkingTimeEntry {
  id: string;
  userId: string;
  type: 'planning' | 'reflection' | 'problem-solving' | 'creative' | 'other';
  duration: number; // minutes
  topic?: string;
  insights?: string;
  actionItems?: string[];
  timestamp: Date;
}

export interface StretchingEntry {
  id: string;
  userId: string;
  type: 'dynamic' | 'static' | 'yoga' | 'foam-rolling' | 'other';
  duration: number; // minutes
  areas: string[]; // body areas focused on
  flexibility: 1 | 2 | 3 | 4 | 5; // feeling after
  notes?: string;
  timestamp: Date;
}

export interface RecoveryEntry {
  id: string;
  userId: string;
  activities: RecoveryActivity[];
  overallFeeling: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  timestamp: Date;
}

export interface RecoveryActivity {
  type: 'massage' | 'sauna' | 'ice-bath' | 'compression' | 'rest' | 'light-activity' | 'other';
  duration: number; // minutes
  intensity: 'light' | 'moderate' | 'intense';
}

export interface ReadingEntry {
  id: string;
  userId: string;
  title: string;
  author?: string;
  category: 'fiction' | 'non-fiction' | 'business' | 'self-help' | 'technical' | 'other';
  duration: number; // minutes
  pages?: number;
  progress?: number; // percentage
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  timestamp: Date;
}

export interface StudyEntry {
  id: string;
  userId: string;
  subject: string;
  type: 'course' | 'tutorial' | 'practice' | 'research' | 'certification' | 'other';
  duration: number; // minutes
  platform?: string; // Coursera, YouTube, etc.
  progress?: number; // percentage
  comprehension: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  timestamp: Date;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  motivation: 1 | 2 | 3 | 4 | 5;
  gratitude?: string[];
  achievements?: string[];
  challenges?: string[];
  tomorrowGoals?: string[];
  freeForm: string;
  tags?: string[];
  timestamp: Date;
}

export interface TimerSession {
  id: string;
  userId: string;
  type: 'hiit' | 'stopwatch' | 'countdown' | 'pomodoro' | 'tabata' | 'custom';
  name?: string;
  duration: number; // total time in seconds
  settings: TimerSettings;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface TimerSettings {
  workTime?: number; // seconds
  restTime?: number; // seconds
  rounds?: number;
  cycles?: number;
  autoStart?: boolean;
  sounds?: boolean;
}

// Analytics and reporting interfaces
export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  metrics: {
    weight: { average: number; change: number };
    sleep: { average: number; quality: number };
    workouts: { count: number; totalDuration: number };
    calories: { average: number; protein: number };
    mood: { average: number };
    energy: { average: number };
  };
  goals: {
    achieved: string[];
    missed: string[];
    progress: { [key: string]: number };
  };
  insights: string[];
  suggestions: string[];
  createdAt: Date;
}

export interface MonthlyReport {
  id: string;
  userId: string;
  monthStart: Date;
  monthEnd: Date;
  weeklyReports: string[]; // IDs of weekly reports
  trends: {
    weight: 'increasing' | 'decreasing' | 'stable';
    fitness: 'improving' | 'declining' | 'stable';
    sleep: 'improving' | 'declining' | 'stable';
    mood: 'improving' | 'declining' | 'stable';
  };
  achievements: string[];
  recommendations: string[];
  createdAt: Date;
}