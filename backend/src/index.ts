import { initializeApp } from 'firebase-admin/app';
import * as functions from 'firebase-functions';
import { 
  userService,
  weightService,
  sleepService,
  mealService,
  workoutService,
  diaryService,
  timerService,
  analyticsService
} from './services/firestore';

// Initialize Firebase Admin
initializeApp();

// User Profile Management
export const createUserProfile = functions.auth.user().onCreate(async (user: any) => {
  const userProfile = {
    email: user.email || '',
    displayName: user.displayName || '',
    familyId: 'default', // You can implement family grouping later
    role: 'member' as const,
    preferences: {
      units: 'imperial' as const,
      timezone: 'America/Chicago',
      notifications: {
        dailyReminder: true,
        weeklyReport: true,
        goalAchievements: true
      }
    },
    goals: {
      weightTarget: 180,
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyWater: 2000,
      weeklyWorkouts: 4,
      dailySleep: 480, // 8 hours in minutes
      dailyMeditation: 20
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    await userService.create(userProfile);
    console.log('User profile created for:', user.uid);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});

// Weight Tracking
export const addWeightEntry = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const entryId = await weightService.create({
      userId: context.auth.uid,
      weight: data.weight,
      unit: data.unit || 'lbs',
      bodyFat: data.bodyFat,
      muscleMass: data.muscleMass,
      notes: data.notes,
      timestamp: new Date(data.timestamp || Date.now())
    });
    return { success: true, id: entryId };
  } catch (error) {
    console.error('Error adding weight entry:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add weight entry');
  }
});

// Sleep Tracking
export const addSleepEntry = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const entryId = await sleepService.create({
      userId: context.auth.uid,
      bedTime: new Date(data.bedTime),
      wakeTime: new Date(data.wakeTime),
      duration: data.duration,
      quality: data.quality,
      restfulness: data.restfulness,
      notes: data.notes,
      timestamp: new Date(data.timestamp || Date.now())
    });
    return { success: true, id: entryId };
  } catch (error) {
    console.error('Error adding sleep entry:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add sleep entry');
  }
});

// Get User Data
export const getUserTrackingData = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { type, limit, days } = data;
    const userId = context.auth.uid;

    if (type === 'stats') {
      const stats = await analyticsService.getUserStats(userId, days || 30);
      return { success: true, data: stats };
    }

    // Get specific data type
    let service;
    switch (type) {
      case 'weight':
        service = weightService;
        break;
      case 'sleep':
        service = sleepService;
        break;
      case 'meals':
        service = mealService;
        break;
      case 'workouts':
        service = workoutService;
        break;
      case 'diary':
        service = diaryService;
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid data type');
    }

    const entries = await service.getByUserId(userId, limit);
    return { success: true, data: entries };

  } catch (error) {
    console.error('Error getting user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get user data');
  }
});

// Generate Weekly Report
export const generateWeeklyReport = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { weekStart, weekEnd } = data;
    const userId = context.auth.uid;
    
    const report = await analyticsService.generateWeeklyReport(
      userId,
      new Date(weekStart),
      new Date(weekEnd)
    );
    
    return { success: true, data: report };
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate weekly report');
  }
});

// Timer Sessions
export const saveTimerSession = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const entryId = await timerService.create({
      userId: context.auth.uid,
      type: data.type,
      name: data.name,
      duration: data.duration,
      settings: data.settings || {},
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      completed: data.completed || false
    });
    return { success: true, id: entryId };
  } catch (error) {
    console.error('Error saving timer session:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save timer session');
  }
});

  const trackingEntry = {
    userId,
    type,
    data: entryData,
    date: date || new Date(),
    createdAt: new Date()
  };

  try {
    const docRef = await db.collection('tracking').add(trackingEntry);
    
    // Update user's latest metrics
    if (type === 'weight') {
      await db.collection('users').doc(userId).update({
        'profile.currentWeight': entryData.weight,
        'profile.lastWeightUpdate': new Date()
      });
    }

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding tracking entry:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add tracking entry');
  }
});

// Get User Tracking Data
export const getUserTrackingData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { startDate, endDate, type } = data;
  const userId = context.auth.uid;

  try {
    let query = db.collection('tracking')
      .where('userId', '==', userId)
      .orderBy('date', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const snapshot = await query.limit(100).get();
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { entries, success: true };
  } catch (error) {
    console.error('Error getting tracking data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get tracking data');
  }
});

// Analytics Functions
export const generateWeeklyReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  try {
    const snapshot = await db.collection('tracking')
      .where('userId', '==', userId)
      .where('date', '>=', weekStart)
      .get();

    const entries = snapshot.docs.map(doc => doc.data());
    
    // Calculate weekly statistics
    const weightEntries = entries.filter(e => e.type === 'weight');
    const sleepEntries = entries.filter(e => e.type === 'sleep');
    const workoutEntries = entries.filter(e => e.type === 'workout');
    const mealEntries = entries.filter(e => e.type === 'meal');

    const report = {
      period: 'week',
      startDate: weekStart,
      endDate: new Date(),
      stats: {
        weightChange: calculateWeightChange(weightEntries),
        avgSleep: calculateAverageSleep(sleepEntries),
        totalWorkouts: workoutEntries.length,
        avgCalories: calculateAverageCalories(mealEntries),
        workoutMinutes: calculateTotalWorkoutTime(workoutEntries)
      },
      insights: generateInsights(entries),
      goals: await checkGoalProgress(userId)
    };

    return report;
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

// Helper Functions
function calculateWeightChange(weightEntries: any[]) {
  if (weightEntries.length < 2) return 0;
  
  const sorted = weightEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted[sorted.length - 1].data.weight - sorted[0].data.weight;
}

function calculateAverageSleep(sleepEntries: any[]) {
  if (sleepEntries.length === 0) return 0;
  
  const totalSleep = sleepEntries.reduce((sum, entry) => sum + entry.data.hours, 0);
  return totalSleep / sleepEntries.length;
}

function calculateAverageCalories(mealEntries: any[]) {
  if (mealEntries.length === 0) return 0;
  
  const totalCalories = mealEntries.reduce((sum, entry) => sum + (entry.data.calories || 0), 0);
  return totalCalories / mealEntries.length;
}

function calculateTotalWorkoutTime(workoutEntries: any[]) {
  return workoutEntries.reduce((total, entry) => total + (entry.data.duration || 0), 0);
}

function generateInsights(entries: any[]) {
  const insights = [];
  
  // Sleep insights
  const sleepEntries = entries.filter(e => e.type === 'sleep');
  if (sleepEntries.length > 0) {
    const avgSleep = calculateAverageSleep(sleepEntries);
    if (avgSleep < 7) {
      insights.push({
        type: 'sleep',
        message: 'Consider getting more sleep for better recovery',
        priority: 'high'
      });
    } else if (avgSleep >= 8) {
      insights.push({
        type: 'sleep',
        message: 'Excellent sleep habits! Keep it up',
        priority: 'low'
      });
    }
  }

  // Workout insights
  const workoutEntries = entries.filter(e => e.type === 'workout');
  if (workoutEntries.length === 0) {
    insights.push({
      type: 'exercise',
      message: 'Try to add at least 3 workouts per week',
      priority: 'high'
    });
  } else if (workoutEntries.length >= 5) {
    insights.push({
      type: 'exercise',
      message: 'Great workout consistency!',
      priority: 'low'
    });
  }

  return insights;
}

async function checkGoalProgress(userId: string) {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData?.profile?.goals) return [];
  
  // Implementation for goal progress checking
  return userData.profile.goals.map((goal: any) => ({
    ...goal,
    progress: 0.7 // Placeholder - implement actual progress calculation
  }));
}

// Scheduled Functions
export const dailyNotifications = functions.pubsub.schedule('0 8 * * *')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    // Send daily reminder notifications
    console.log('Sending daily notifications...');
    
    // Implementation for sending push notifications to remind users to log their data
    
    return null;
  });

export const weeklyAnalytics = functions.pubsub.schedule('0 9 * * 1')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    // Generate weekly analytics for all users
    console.log('Generating weekly analytics...');
    
    // Implementation for batch processing weekly reports
    
    return null;
  });