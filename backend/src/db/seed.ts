import { db } from './index.js';
import { exerciseDefinitions } from './schema.js';
import { count } from 'drizzle-orm';

interface SeedExercise {
  name: string;
  muscleGroup: 'legs' | 'push' | 'pull' | 'core' | 'cardio';
}

const exercisesToSeed: SeedExercise[] = [
  // Legs (12)
  { name: 'Barbell Squat', muscleGroup: 'legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs' },
  { name: 'Leg Press', muscleGroup: 'legs' },
  { name: 'Leg Curl', muscleGroup: 'legs' },
  { name: 'Leg Extension', muscleGroup: 'legs' },
  { name: 'Dumbbell Step-Up', muscleGroup: 'legs' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs' },
  { name: 'Hack Squat', muscleGroup: 'legs' },
  { name: 'Goblet Squat', muscleGroup: 'legs' },
  { name: 'Hip Thrust', muscleGroup: 'legs' },
  { name: 'Calf Raise', muscleGroup: 'legs' },
  { name: 'Front Squat', muscleGroup: 'legs' },

  // Push (11)
  { name: 'Bench Press', muscleGroup: 'push' },
  { name: 'Incline Bench Press', muscleGroup: 'push' },
  { name: 'Overhead Press', muscleGroup: 'push' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'push' },
  { name: 'Lateral Raise', muscleGroup: 'push' },
  { name: 'Tricep Pushdown', muscleGroup: 'push' },
  { name: 'Skull Crusher', muscleGroup: 'push' },
  { name: 'Dips', muscleGroup: 'push' },
  { name: 'Push-Up', muscleGroup: 'push' },
  { name: 'Cable Fly', muscleGroup: 'push' },
  { name: 'Chest Press Machine', muscleGroup: 'push' },

  // Pull (12)
  { name: 'Deadlift', muscleGroup: 'pull' },
  { name: 'Barbell Row', muscleGroup: 'pull' },
  { name: 'Dumbbell Row', muscleGroup: 'pull' },
  { name: 'Pull-Up', muscleGroup: 'pull' },
  { name: 'Chin-Up', muscleGroup: 'pull' },
  { name: 'Lat Pulldown', muscleGroup: 'pull' },
  { name: 'Seated Cable Row', muscleGroup: 'pull' },
  { name: 'Face Pull', muscleGroup: 'pull' },
  { name: 'Bicep Curl', muscleGroup: 'pull' },
  { name: 'Hammer Curl', muscleGroup: 'pull' },
  { name: 'EZ Bar Curl', muscleGroup: 'pull' },
  { name: 'T-Bar Row', muscleGroup: 'pull' },

  // Core (7)
  { name: 'Plank', muscleGroup: 'core' },
  { name: 'Ab Wheel', muscleGroup: 'core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'core' },
  { name: 'Cable Crunch', muscleGroup: 'core' },
  { name: 'Russian Twist', muscleGroup: 'core' },
  { name: 'Dead Bug', muscleGroup: 'core' },
  { name: 'Decline Sit-Up', muscleGroup: 'core' },

  // Cardio (8)
  { name: 'Treadmill', muscleGroup: 'cardio' },
  { name: 'Stationary Bike', muscleGroup: 'cardio' },
  { name: 'Rowing Machine', muscleGroup: 'cardio' },
  { name: 'Jump Rope', muscleGroup: 'cardio' },
  { name: 'Stair Climber', muscleGroup: 'cardio' },
  { name: 'Elliptical', muscleGroup: 'cardio' },
  { name: 'Battle Ropes', muscleGroup: 'cardio' },
  { name: 'Assault Bike', muscleGroup: 'cardio' }
];

export async function seedExercises() {
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(exerciseDefinitions);

    if (value === 0) {
      console.log('Seeding default exercises...');
      await db.insert(exerciseDefinitions).values(
        exercisesToSeed.map((ex) => ({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          isCustom: false,
          createdBy: null,
        }))
      );
      console.log('Successfully seeded 50 global exercises.');
    } else {
      console.log(`Database already has ${value} exercise definitions. Skipping seeding.`);
    }
  } catch (error) {
    console.error('Error during exercise seeding:', error);
  }
}
