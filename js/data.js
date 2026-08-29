// Live Airtable schema + seeded reference data for base "Putting in the Work".
// Pulled from the Airtable API on 2026-08-28, updated 2026-08-29 (Video URL
// fields on Workout Logs/Templates, Age player). If the base schema
// changes, re-fetch via the Airtable API and update this file — do not guess
// field names.

const BASE_ID = 'appYZdp23DOulnJwm';

const TABLES = {
  players: { id: 'tblXCKFlEX3IgBlIS', name: 'Players' },
  workoutTemplates: { id: 'tblax7TAtj3urYjZd', name: 'Workout Templates' },
  workoutLogs: { id: 'tblHSTsJt5tSjUqGI', name: 'Workout Logs' },
  strengthLogs: { id: 'tblucC5pYqfQE6TXb', name: 'Strength Logs' },
  testDefinitions: { id: 'tblDjbpWKpKW5kole', name: 'Test Definitions' },
  benchmarkResults: { id: 'tbl9THCHIiu3bvk2s', name: 'Benchmark Results' },
  spotDefinitions: { id: 'tblqimy54LwACJOy8', name: 'Spot Definitions' },
  shootingSessions: { id: 'tblGaH3l00WfcVJCO', name: 'Shooting Sessions' },
  shotSpotResults: { id: 'tblUD2jxeVxERmEc6', name: 'Shot Spot Results' },
  gameLog: { id: 'tblFeVbGugAPQkhHS', name: 'Game Log' },
};

// Field NAMES as they exist in Airtable right now (case-sensitive; used as
// keys in the REST API "fields" object). Do not rename without checking the
// live base first — a couple of tables use "Log Entry" instead of "Name".
const FIELDS = {
  workoutTemplates: {
    name: 'Name',
    description: 'Description',
    videoUrl: 'Video URL',
  },
  workoutLogs: {
    logEntry: 'Log Entry',
    comments: 'Comments',
    player: 'Player',
    template: 'Template',
    date: 'Date',
    duration: 'Duration (min)',
    intensity: 'Intensity (Effort)',
    grade: 'Performance Grade',
    category: 'Category',
    videoUrl: 'Video URL',
  },
  strengthLogs: {
    logEntry: 'Log Entry',
    notes: 'Notes',
    player: 'Player',
    date: 'Date',
    exercise: 'Exercise Name',
    weight: 'Weight',
    reps: 'Reps',
    sets: 'Sets',
    linkedWorkout: 'Linked Workout Log',
  },
  benchmarkResults: {
    logEntry: 'Log Entry',
    notes: 'Notes',
    player: 'Player',
    test: 'Test',
    date: 'Date',
    resultValue: 'Result Value',
  },
  shootingSessions: {
    logEntry: 'Log Entry',
    comments: 'Comments',
    player: 'Player',
    date: 'Date',
    duration: 'Duration (min)',
    intensity: 'Intensity (Effort)',
    grade: 'Performance Grade',
  },
  shotSpotResults: {
    logEntry: 'Log Entry',
    notes: 'Notes',
    session: 'Session',
    spot: 'Spot',
    makes: 'Makes',
    misses: 'Misses',
  },
  gameLog: {
    opponent: 'Opponent',
    whatWentWell: 'What Went Well',
    whatToWorkOn: 'What To Work On',
    player: 'Player',
    date: 'Date',
    minutesPlayed: 'Minutes Played',
    points: 'Points',
    rebounds: 'Rebounds',
    assists: 'Assists',
  },
};

// Seeded reference records (record IDs are stable — these are the real rows
// in the live base, not placeholders). `screens` controls which home-screen
// tiles show up for that profile — Age does walks, not basketball, so
// the basketball-specific screens (shooting/benchmark/game) are hidden for
// her rather than shown-but-irrelevant.
const ALL_SCREENS = ['workout', 'strength', 'shooting', 'benchmark', 'game'];
const PLAYERS = [
  { id: 'reclIhUYdKG4LeOkH', name: 'Mal', ageGroup: 'adult', screens: ALL_SCREENS },
  { id: 'recZ4Qha8inCHDE8s', name: 'Ike', ageGroup: '12-14', screens: ALL_SCREENS },
  { id: 'recuJGpFhmRW4V1GK', name: 'Khi', ageGroup: '9-11', screens: ALL_SCREENS },
  { id: 'recgP5EtYuvNd96io', name: 'Age', ageGroup: 'adult', screens: ['workout', 'strength'] },
];

const SPOTS = [
  { id: 'recvt7IoNGUs25crN', name: 'Left Corner', number: 1 },
  { id: 'recPcsCe8Vfft397Y', name: 'Left Baseline', number: 2 },
  { id: 'recPZg3xkZZMTeups', name: 'Top of Key', number: 3 },
  { id: 'recxpTUiUwDhkuwhd', name: 'Right Baseline', number: 4 },
  { id: 'recAgwKaHLH3DWyRn', name: 'Right Corner', number: 5 },
  { id: 'recgRM7M8YjlOjrpz', name: 'Left Wing', number: 6 },
  { id: 'recVQvwPZp6nxzhhg', name: 'Left Elbow', number: 7 },
  { id: 'recWuDrGt3jQs5KOR', name: 'Free Throw', number: 8 },
  { id: 'rec0fYXQfKksH5z7Q', name: 'Right Elbow', number: 9 },
  { id: 'recCaPGjortnBvHBr', name: 'Right Wing', number: 10 },
  { id: 'recH94U836VFT3zdQ', name: 'Left Mid-Paint', number: 11 },
  { id: 'recgsSiMW9lzPpuwE', name: 'Right Mid-Paint', number: 12 },
  { id: 'recOKWcUxOwZfEkt8', name: 'Left High Post', number: 13 },
  { id: 'recNE7eo8TTYx1IXj', name: 'Right High Post', number: 14 },
];

const TESTS = [
  { id: 'recqzPy7g5b1mLL3A', name: 'Vertical Jump', unit: 'inches', category: 'Speed' },
  { id: 'recx8vVj8t4rb1Suv', name: 'Standing Broad Jump', unit: 'inches', category: 'Speed' },
  { id: 'rec8v2fdWTj3RVU7M', name: '20-Yard Sprint', unit: 'seconds', category: 'Speed' },
  { id: 'recUcjoZDn78zISUX', name: 'Pro Agility Shuttle (5-10-5)', unit: 'seconds', category: 'Speed' },
  { id: 'recv8TYuWGJR0MwdI', name: 'Single-Leg Balance Hold', unit: 'seconds', category: 'Balance' },
  { id: 'rec3EIKHvk19pPWVL', name: 'Max Push-Ups or Bodyweight Squats in 60s', unit: 'reps', category: 'Strength-Test' },
  { id: 'recGodRHrvDUqjs0x', name: 'Dribbling Cone-Weave (Strong Hand)', unit: 'seconds', category: 'Dribbling' },
  { id: 'rec0SfWZMZROUczTe', name: 'Dribbling Cone-Weave (Weak Hand)', unit: 'seconds', category: 'Dribbling' },
];

// Workout Templates table is currently empty in the live base — populated at
// runtime from the cache/sync layer if the user adds templates later.
const WORKOUT_TEMPLATES = [];

// Single-select choice options (exact, case-sensitive strings from Airtable).
const CHOICES = {
  category3: ['Basketball', 'Weightlifting', 'Other'], // Workout Logs / Workout Templates Category
  rating4: ['1', '2', '3', '4'], // Intensity (Effort) / Performance Grade
};

// App-side convenience list only (NOT an Airtable field) — Strength Logs
// "Exercise Name" is free text, this just seeds the picker with an "Other"
// escape hatch to type a custom exercise.
const COMMON_EXERCISES = [
  'Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row',
  'Goblet Squat', 'Lunge', 'Push-Up', 'Pull-Up', 'Plank',
  'Med Ball Slam', 'Kettlebell Swing', 'Box Jump', 'Other',
];
