// Exercise Routine Builder Service
// Manages creation, storage, and execution of custom workout routines

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'core' | 'functional';
  muscleGroups: string[];
  equipment: string[];
  description: string;
  instructions: string[];
  defaultSets?: number;
  defaultReps?: number;
  defaultDuration?: number; // in seconds
  defaultWeight?: number; // in lbs/kg
}

export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
  restTime?: number; // in seconds
  completed: boolean;
  notes?: string;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: ExerciseSet[];
  restBetweenSets: number; // default rest time in seconds
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  exercises: RoutineExercise[];
  tags: string[];
  createdAt: string;
  lastUsed?: string;
  timesCompleted: number;
  isFavorite: boolean;
  createdBy: 'user' | 'template';
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  exercises: RoutineExercise[];
  totalSets: number;
  completedSets: number;
  notes?: string;
  rating?: number; // 1-5 stars
  calories?: number;
  status: 'in-progress' | 'completed' | 'paused';
}

export class ExerciseRoutineService {
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

  // Predefined exercise database
  private exerciseDatabase: Exercise[] = [
    {
      id: 'push-up',
      name: 'Push-ups',
      category: 'strength',
      muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
      equipment: ['bodyweight'],
      description: 'Classic bodyweight exercise for upper body strength',
      instructions: [
        'Start in plank position with hands shoulder-width apart',
        'Lower body until chest nearly touches floor',
        'Push back up to starting position',
        'Keep core engaged throughout movement'
      ],
      defaultSets: 3,
      defaultReps: 12
    },
    {
      id: 'squat',
      name: 'Squats',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
      equipment: ['bodyweight'],
      description: 'Fundamental lower body exercise',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower hips back and down as if sitting in chair',
        'Keep knees in line with toes',
        'Return to standing position'
      ],
      defaultSets: 3,
      defaultReps: 15
    },
    {
      id: 'plank',
      name: 'Plank',
      category: 'core',
      muscleGroups: ['core', 'shoulders', 'glutes'],
      equipment: ['bodyweight'],
      description: 'Isometric core strengthening exercise',
      instructions: [
        'Start in push-up position on forearms',
        'Keep body in straight line from head to heels',
        'Engage core and breathe normally',
        'Hold position for specified time'
      ],
      defaultSets: 3,
      defaultDuration: 30
    },
    {
      id: 'jumping-jacks',
      name: 'Jumping Jacks',
      category: 'cardio',
      muscleGroups: ['full body', 'cardiovascular'],
      equipment: ['bodyweight'],
      description: 'High-energy cardiovascular exercise',
      instructions: [
        'Start standing with feet together, arms at sides',
        'Jump feet apart while raising arms overhead',
        'Jump back to starting position',
        'Maintain steady rhythm'
      ],
      defaultSets: 3,
      defaultDuration: 60
    },
    {
      id: 'lunges',
      name: 'Lunges',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
      equipment: ['bodyweight'],
      description: 'Unilateral leg strengthening exercise',
      instructions: [
        'Step forward with one leg',
        'Lower hips until both knees bent at 90 degrees',
        'Push back to starting position',
        'Alternate legs or complete all reps on one side'
      ],
      defaultSets: 3,
      defaultReps: 12
    },
    {
      id: 'burpees',
      name: 'Burpees',
      category: 'functional',
      muscleGroups: ['full body', 'cardiovascular'],
      equipment: ['bodyweight'],
      description: 'Full-body conditioning exercise',
      instructions: [
        'Start standing, drop into squat position',
        'Place hands on ground, jump feet back to plank',
        'Do push-up, jump feet back to squat',
        'Jump up with arms overhead'
      ],
      defaultSets: 3,
      defaultReps: 8
    },
    {
      id: 'mountain-climbers',
      name: 'Mountain Climbers',
      category: 'cardio',
      muscleGroups: ['core', 'shoulders', 'legs', 'cardiovascular'],
      equipment: ['bodyweight'],
      description: 'Dynamic cardio and core exercise',
      instructions: [
        'Start in plank position',
        'Alternate bringing knees to chest rapidly',
        'Keep hips level and core engaged',
        'Maintain quick tempo'
      ],
      defaultSets: 3,
      defaultDuration: 45
    },
    {
      id: 'deadlift',
      name: 'Deadlifts',
      category: 'strength',
      muscleGroups: ['hamstrings', 'glutes', 'lower back', 'traps'],
      equipment: ['barbell', 'dumbbells'],
      description: 'Compound movement for posterior chain',
      instructions: [
        'Stand with feet hip-width apart, bar over mid-foot',
        'Bend at hips and knees to grip bar',
        'Keep chest up, pull bar close to body',
        'Stand up by driving through heels'
      ],
      defaultSets: 3,
      defaultReps: 8,
      defaultWeight: 135
    }
  ];

  constructor() {
    this.initializeDefaultRoutines();
  }

  // Initialize with some template routines
  private initializeDefaultRoutines() {
    const existingRoutines = this.storage.get('workoutRoutines', []);
    if (existingRoutines.length === 0) {
      const defaultRoutines = this.createDefaultRoutines();
      this.storage.set('workoutRoutines', defaultRoutines);
    }
  }

  // Create default template routines
  private createDefaultRoutines(): WorkoutRoutine[] {
    return [
      {
        id: 'beginner-bodyweight',
        name: 'Beginner Bodyweight Workout',
        description: 'Perfect starter routine for building basic strength',
        category: 'strength',
        difficulty: 'beginner',
        estimatedDuration: 25,
        exercises: [
          {
            id: '1',
            exerciseId: 'push-up',
            exercise: this.exerciseDatabase.find(e => e.id === 'push-up')!,
            sets: [
              { setNumber: 1, reps: 8, restTime: 60, completed: false },
              { setNumber: 2, reps: 8, restTime: 60, completed: false },
              { setNumber: 3, reps: 8, restTime: 90, completed: false }
            ],
            restBetweenSets: 60
          },
          {
            id: '2',
            exerciseId: 'squat',
            exercise: this.exerciseDatabase.find(e => e.id === 'squat')!,
            sets: [
              { setNumber: 1, reps: 12, restTime: 60, completed: false },
              { setNumber: 2, reps: 12, restTime: 60, completed: false },
              { setNumber: 3, reps: 12, restTime: 90, completed: false }
            ],
            restBetweenSets: 60
          },
          {
            id: '3',
            exerciseId: 'plank',
            exercise: this.exerciseDatabase.find(e => e.id === 'plank')!,
            sets: [
              { setNumber: 1, duration: 20, restTime: 60, completed: false },
              { setNumber: 2, duration: 25, restTime: 60, completed: false },
              { setNumber: 3, duration: 30, restTime: 0, completed: false }
            ],
            restBetweenSets: 60
          }
        ],
        tags: ['bodyweight', 'beginner', 'strength'],
        createdAt: new Date().toISOString(),
        timesCompleted: 0,
        isFavorite: false,
        createdBy: 'template'
      },
      {
        id: 'hiit-cardio',
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for cardio fitness',
        category: 'hiit',
        difficulty: 'intermediate',
        estimatedDuration: 20,
        exercises: [
          {
            id: '1',
            exerciseId: 'jumping-jacks',
            exercise: this.exerciseDatabase.find(e => e.id === 'jumping-jacks')!,
            sets: [
              { setNumber: 1, duration: 45, restTime: 15, completed: false },
              { setNumber: 2, duration: 45, restTime: 15, completed: false },
              { setNumber: 3, duration: 45, restTime: 60, completed: false }
            ],
            restBetweenSets: 15
          },
          {
            id: '2',
            exerciseId: 'burpees',
            exercise: this.exerciseDatabase.find(e => e.id === 'burpees')!,
            sets: [
              { setNumber: 1, reps: 8, restTime: 30, completed: false },
              { setNumber: 2, reps: 8, restTime: 30, completed: false },
              { setNumber: 3, reps: 8, restTime: 60, completed: false }
            ],
            restBetweenSets: 30
          },
          {
            id: '3',
            exerciseId: 'mountain-climbers',
            exercise: this.exerciseDatabase.find(e => e.id === 'mountain-climbers')!,
            sets: [
              { setNumber: 1, duration: 30, restTime: 30, completed: false },
              { setNumber: 2, duration: 30, restTime: 30, completed: false },
              { setNumber: 3, duration: 30, restTime: 0, completed: false }
            ],
            restBetweenSets: 30
          }
        ],
        tags: ['hiit', 'cardio', 'bodyweight'],
        createdAt: new Date().toISOString(),
        timesCompleted: 0,
        isFavorite: true,
        createdBy: 'template'
      }
    ];
  }

  // Get all available exercises
  getExerciseDatabase(): Exercise[] {
    return [...this.exerciseDatabase];
  }

  // Get exercises by category
  getExercisesByCategory(category: string): Exercise[] {
    return this.exerciseDatabase.filter(exercise => exercise.category === category);
  }

  // Search exercises
  searchExercises(query: string): Exercise[] {
    const lowerQuery = query.toLowerCase();
    return this.exerciseDatabase.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(lowerQuery)) ||
      exercise.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Routine Management
  getAllRoutines(): WorkoutRoutine[] {
    return this.storage.get('workoutRoutines', []);
  }

  getRoutineById(id: string): WorkoutRoutine | null {
    const routines = this.getAllRoutines();
    return routines.find(routine => routine.id === id) || null;
  }

  createRoutine(routine: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'timesCompleted'>): WorkoutRoutine {
    const newRoutine: WorkoutRoutine = {
      ...routine,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      timesCompleted: 0
    };

    const routines = this.getAllRoutines();
    routines.push(newRoutine);
    this.storage.set('workoutRoutines', routines);

    return newRoutine;
  }

  updateRoutine(id: string, updates: Partial<WorkoutRoutine>): WorkoutRoutine | null {
    const routines = this.getAllRoutines();
    const index = routines.findIndex(routine => routine.id === id);
    
    if (index === -1) return null;

    routines[index] = { ...routines[index], ...updates };
    this.storage.set('workoutRoutines', routines);

    return routines[index];
  }

  deleteRoutine(id: string): boolean {
    const routines = this.getAllRoutines();
    const filteredRoutines = routines.filter(routine => routine.id !== id);
    
    if (filteredRoutines.length === routines.length) return false;

    this.storage.set('workoutRoutines', filteredRoutines);
    return true;
  }

  duplicateRoutine(id: string, newName?: string): WorkoutRoutine | null {
    const routine = this.getRoutineById(id);
    if (!routine) return null;

    const duplicated = {
      ...routine,
      name: newName || `${routine.name} (Copy)`,
      createdBy: 'user' as const
    };

    // Reset completion status on exercises
    duplicated.exercises = duplicated.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({ ...set, completed: false }))
    }));

    return this.createRoutine(duplicated);
  }

  // Workout Session Management
  startWorkoutSession(routineId: string): WorkoutSession {
    const routine = this.getRoutineById(routineId);
    if (!routine) throw new Error('Routine not found');

    const session: WorkoutSession = {
      id: Date.now().toString(),
      routineId,
      routineName: routine.name,
      startTime: new Date().toISOString(),
      exercises: routine.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({ ...set, completed: false }))
      })),
      totalSets: routine.exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
      completedSets: 0,
      status: 'in-progress'
    };

    this.storage.set('currentWorkoutSession', session);
    return session;
  }

  getCurrentSession(): WorkoutSession | null {
    return this.storage.get('currentWorkoutSession', null);
  }

  updateSession(updates: Partial<WorkoutSession>): WorkoutSession | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    const updatedSession = { ...session, ...updates };
    this.storage.set('currentWorkoutSession', updatedSession);
    return updatedSession;
  }

  completeSet(exerciseIndex: number, setIndex: number): WorkoutSession | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    session.exercises[exerciseIndex].sets[setIndex].completed = true;
    session.completedSets = session.exercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.completed).length, 0
    );

    this.storage.set('currentWorkoutSession', session);
    return session;
  }

  finishWorkoutSession(rating?: number, notes?: string): WorkoutSession | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    const finishedSession: WorkoutSession = {
      ...session,
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000),
      rating,
      notes,
      status: 'completed'
    };

    // Save to workout history
    const history = this.storage.get('workoutHistory', []);
    history.push(finishedSession);
    this.storage.set('workoutHistory', history);

    // Update routine stats
    const routine = this.getRoutineById(session.routineId);
    if (routine) {
      this.updateRoutine(routine.id, {
        timesCompleted: routine.timesCompleted + 1,
        lastUsed: new Date().toISOString()
      });
    }

    // Clear current session
    localStorage.removeItem('currentWorkoutSession');

    return finishedSession;
  }

  // Statistics and Analytics
  getWorkoutHistory(): WorkoutSession[] {
    return this.storage.get('workoutHistory', []);
  }

  getRoutineStats(routineId: string) {
    const history = this.getWorkoutHistory();
    const routineSessions = history.filter(session => session.routineId === routineId);

    if (routineSessions.length === 0) {
      return {
        timesCompleted: 0,
        averageDuration: 0,
        averageRating: 0,
        lastCompleted: null,
        totalTimeSpent: 0
      };
    }

    const totalDuration = routineSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const ratingsWithValues = routineSessions.filter(session => session.rating).map(session => session.rating!);
    const averageRating = ratingsWithValues.length > 0 
      ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) / ratingsWithValues.length 
      : 0;

    return {
      timesCompleted: routineSessions.length,
      averageDuration: Math.round(totalDuration / routineSessions.length),
      averageRating: Math.round(averageRating * 10) / 10,
      lastCompleted: routineSessions[routineSessions.length - 1]?.endTime || null,
      totalTimeSpent: totalDuration
    };
  }
}

export const exerciseRoutineService = new ExerciseRoutineService();