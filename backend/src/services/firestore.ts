import * as admin from 'firebase-admin';
import { 
  UserProfile, 
  WeightEntry, 
  SleepEntry, 
  MealEntry, 
  WorkoutEntry,
  MeditationEntry,
  ThinkingTimeEntry,
  StretchingEntry,
  RecoveryEntry,
  ReadingEntry,
  StudyEntry,
  DiaryEntry,
  TimerSession,
  WeeklyReport,
  MonthlyReport
} from '../types';

const db = admin.firestore();

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  WEIGHT: 'weight_entries',
  SLEEP: 'sleep_entries', 
  MEALS: 'meal_entries',
  WORKOUTS: 'workout_entries',
  MEDITATION: 'meditation_entries',
  THINKING: 'thinking_entries',
  STRETCHING: 'stretching_entries',
  RECOVERY: 'recovery_entries',
  READING: 'reading_entries',
  STUDY: 'study_entries',
  DIARY: 'diary_entries',
  TIMERS: 'timer_sessions',
  WEEKLY_REPORTS: 'weekly_reports',
  MONTHLY_REPORTS: 'monthly_reports'
};

// Generic CRUD operations
export class FirestoreService<T> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await db.collection(this.collectionName).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  }

  async getById(id: string): Promise<T | null> {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  async getByUserId(userId: string, limit?: number): Promise<T[]> {
    let query = db.collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');
    
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await db.collection(this.collectionName).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async delete(id: string): Promise<void> {
    await db.collection(this.collectionName).doc(id).delete();
  }

  async getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<T[]> {
    const snapshot = await db.collection(this.collectionName)
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
  }
}

// Specific service instances
export const userService = new FirestoreService<UserProfile>(COLLECTIONS.USERS);
export const weightService = new FirestoreService<WeightEntry>(COLLECTIONS.WEIGHT);
export const sleepService = new FirestoreService<SleepEntry>(COLLECTIONS.SLEEP);
export const mealService = new FirestoreService<MealEntry>(COLLECTIONS.MEALS);
export const workoutService = new FirestoreService<WorkoutEntry>(COLLECTIONS.WORKOUTS);
export const meditationService = new FirestoreService<MeditationEntry>(COLLECTIONS.MEDITATION);
export const thinkingService = new FirestoreService<ThinkingTimeEntry>(COLLECTIONS.THINKING);
export const stretchingService = new FirestoreService<StretchingEntry>(COLLECTIONS.STRETCHING);
export const recoveryService = new FirestoreService<RecoveryEntry>(COLLECTIONS.RECOVERY);
export const readingService = new FirestoreService<ReadingEntry>(COLLECTIONS.READING);
export const studyService = new FirestoreService<StudyEntry>(COLLECTIONS.STUDY);
export const diaryService = new FirestoreService<DiaryEntry>(COLLECTIONS.DIARY);
export const timerService = new FirestoreService<TimerSession>(COLLECTIONS.TIMERS);
export const weeklyReportService = new FirestoreService<WeeklyReport>(COLLECTIONS.WEEKLY_REPORTS);
export const monthlyReportService = new FirestoreService<MonthlyReport>(COLLECTIONS.MONTHLY_REPORTS);

// Specialized functions
export class AnalyticsService {
  
  async generateWeeklyReport(userId: string, weekStart: Date, weekEnd: Date): Promise<WeeklyReport> {
    const [weight, sleep, workouts, meals, diary] = await Promise.all([
      weightService.getByDateRange(userId, weekStart, weekEnd),
      sleepService.getByDateRange(userId, weekStart, weekEnd),
      workoutService.getByDateRange(userId, weekStart, weekEnd),
      mealService.getByDateRange(userId, weekStart, weekEnd),
      diaryService.getByDateRange(userId, weekStart, weekEnd)
    ]);

    const metrics = {
      weight: {
        average: weight.length > 0 ? weight.reduce((sum, w) => sum + w.weight, 0) / weight.length : 0,
        change: weight.length > 1 ? weight[0].weight - weight[weight.length - 1].weight : 0
      },
      sleep: {
        average: sleep.length > 0 ? sleep.reduce((sum, s) => sum + s.duration, 0) / sleep.length / 60 : 0,
        quality: sleep.length > 0 ? sleep.reduce((sum, s) => sum + s.quality, 0) / sleep.length : 0
      },
      workouts: {
        count: workouts.length,
        totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0)
      },
      calories: {
        average: meals.length > 0 ? meals.reduce((sum, m) => sum + m.totalCalories, 0) / meals.length : 0,
        protein: meals.length > 0 ? meals.reduce((sum, m) => sum + m.totalProtein, 0) / meals.length : 0
      },
      mood: {
        average: diary.length > 0 ? diary.reduce((sum, d) => sum + d.mood, 0) / diary.length : 0
      },
      energy: {
        average: diary.length > 0 ? diary.reduce((sum, d) => sum + d.energyLevel, 0) / diary.length : 0
      }
    };

    const report: Omit<WeeklyReport, 'id'> = {
      userId,
      weekStart,
      weekEnd,
      metrics,
      goals: {
        achieved: [],
        missed: [],
        progress: {}
      },
      insights: this.generateInsights(metrics),
      suggestions: this.generateSuggestions(metrics),
      createdAt: new Date()
    };

    const reportId = await weeklyReportService.create(report);
    return { ...report, id: reportId };
  }

  private generateInsights(metrics: any): string[] {
    const insights: string[] = [];
    
    if (metrics.sleep.average < 7) {
      insights.push('You averaged less than 7 hours of sleep this week. Consider improving your sleep schedule.');
    }
    
    if (metrics.workouts.count >= 3) {
      insights.push('Great job staying consistent with your workouts!');
    } else if (metrics.workouts.count === 0) {
      insights.push('No workouts recorded this week. Try to incorporate some physical activity.');
    }
    
    if (metrics.mood.average >= 4) {
      insights.push('Your mood has been consistently positive this week!');
    } else if (metrics.mood.average < 3) {
      insights.push('Your mood seems to be lower than usual. Consider what might be affecting it.');
    }

    return insights;
  }

  private generateSuggestions(metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (metrics.sleep.quality < 3) {
      suggestions.push('Try establishing a bedtime routine to improve sleep quality.');
    }
    
    if (metrics.workouts.count < 3) {
      suggestions.push('Aim for at least 3 workouts next week to maintain fitness momentum.');
    }
    
    if (metrics.energy.average < 3) {
      suggestions.push('Low energy levels detected. Focus on nutrition, hydration, and adequate rest.');
    }

    return suggestions;
  }

  async getUserStats(userId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const [weight, sleep, workouts, meals] = await Promise.all([
      weightService.getByDateRange(userId, startDate, endDate),
      sleepService.getByDateRange(userId, startDate, endDate),
      workoutService.getByDateRange(userId, startDate, endDate),
      mealService.getByDateRange(userId, startDate, endDate)
    ]);

    return {
      weight: weight.map(w => ({ date: w.timestamp, value: w.weight })),
      sleep: sleep.map(s => ({ date: s.timestamp, duration: s.duration / 60, quality: s.quality })),
      workouts: workouts.map(w => ({ date: w.timestamp, type: w.type, duration: w.duration })),
      calories: meals.map(m => ({ date: m.timestamp, calories: m.totalCalories, protein: m.totalProtein }))
    };
  }
}

export const analyticsService = new AnalyticsService();