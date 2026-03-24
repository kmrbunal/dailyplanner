export const gymPresets = {
  upper: [
    { name: 'Bench Press', sets: '4', reps: '8-10' },
    { name: 'Overhead Press', sets: '3', reps: '8-10' },
    { name: 'Bent-Over Rows', sets: '4', reps: '10' },
    { name: 'Lat Pulldowns', sets: '3', reps: '10-12' },
    { name: 'Dumbbell Curls', sets: '3', reps: '12' },
    { name: 'Tricep Pushdowns', sets: '3', reps: '12' },
    { name: 'Lateral Raises', sets: '3', reps: '15' },
  ],
  lower: [
    { name: 'Barbell Squats', sets: '4', reps: '8-10' },
    { name: 'Romanian Deadlifts', sets: '3', reps: '10' },
    { name: 'Leg Press', sets: '3', reps: '12' },
    { name: 'Walking Lunges', sets: '3', reps: '12/leg' },
    { name: 'Leg Curls', sets: '3', reps: '12' },
    { name: 'Calf Raises', sets: '4', reps: '15' },
    { name: 'Hip Thrusts', sets: '3', reps: '12' },
  ],
  cardio: [
    { name: 'Treadmill Run', sets: '\u2014', reps: '20 min' },
    { name: 'Jump Rope', sets: '3', reps: '3 min' },
    { name: 'Cycling / Bike', sets: '\u2014', reps: '15 min' },
    { name: 'Rowing Machine', sets: '\u2014', reps: '10 min' },
    { name: 'Burpees', sets: '3', reps: '15' },
    { name: 'Mountain Climbers', sets: '3', reps: '30 sec' },
  ],
  full: [
    { name: 'Deadlifts', sets: '4', reps: '6-8' },
    { name: 'Push-Ups', sets: '3', reps: '15' },
    { name: 'Pull-Ups / Assisted', sets: '3', reps: '8-10' },
    { name: 'Goblet Squats', sets: '3', reps: '12' },
    { name: 'Dumbbell Rows', sets: '3', reps: '10/arm' },
    { name: 'Plank Hold', sets: '3', reps: '45 sec' },
    { name: 'Box Jumps', sets: '3', reps: '10' },
  ],
  rest: [
    { name: 'Foam Rolling', sets: '\u2014', reps: '10 min' },
    { name: 'Stretching Routine', sets: '\u2014', reps: '15 min' },
    { name: 'Light Walking', sets: '\u2014', reps: '20 min' },
    { name: 'Yoga Flow', sets: '\u2014', reps: '15 min' },
  ]
};

export const gymDayLabels = {
  upper: '\uD83D\uDCAA Upper Body Day',
  lower: '\uD83E\uDDB5 Lower Body Day',
  cardio: '\uD83E\uDEC0 Cardio Day',
  full: '\uD83D\uDD25 Full Body Day',
  rest: '\uD83E\uDDD8 Rest / Recovery'
};
