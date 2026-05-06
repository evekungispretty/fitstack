import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const trainerPw = await bcrypt.hash('trainer123', 10)
  const clientPw = await bcrypt.hash('client123', 10)

  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@fitstack.app' },
    update: {},
    create: { email: 'trainer@fitstack.app', password: trainerPw, name: 'Alex Morgan', role: 'TRAINER' },
  })

  const c1User = await prisma.user.upsert({
    where: { email: 'client@fitstack.app' },
    update: {},
    create: { email: 'client@fitstack.app', password: clientPw, name: 'Jordan Lee', role: 'CLIENT' },
  })
  const c2User = await prisma.user.upsert({
    where: { email: 'client2@fitstack.app' },
    update: {},
    create: { email: 'client2@fitstack.app', password: clientPw, name: 'Sam Rivera', role: 'CLIENT' },
  })
  const c3User = await prisma.user.upsert({
    where: { email: 'client3@fitstack.app' },
    update: {},
    create: { email: 'client3@fitstack.app', password: clientPw, name: 'Taylor Kim', role: 'CLIENT' },
  })

  const cp1 = await prisma.clientProfile.upsert({
    where: { userId: c1User.id },
    update: {},
    create: {
      userId: c1User.id, trainerId: trainer.id,
      goal: 'Strength', notes: 'Focuses on compound lifts. Prefers morning sessions.',
      startWeight: 80, currentWeight: 77.5, targetWeight: 75,
    },
  })
  const cp2 = await prisma.clientProfile.upsert({
    where: { userId: c2User.id },
    update: {},
    create: {
      userId: c2User.id, trainerId: trainer.id,
      goal: 'Fat Loss', notes: 'Needs low-impact alternatives for knee issues.',
      startWeight: 90, currentWeight: 86, targetWeight: 78,
    },
  })
  await prisma.clientProfile.upsert({
    where: { userId: c3User.id },
    update: {},
    create: {
      userId: c3User.id, trainerId: trainer.id,
      goal: 'Muscle Gain', notes: 'Beginner. Building habit consistency.',
      startWeight: 65, currentWeight: 67, targetWeight: 72,
    },
  })

  const exercises = [
    { name: 'Bench Press', category: 'Push', muscle: 'Chest', equipment: 'Barbell' },
    { name: 'Squat', category: 'Legs', muscle: 'Quads', equipment: 'Barbell' },
    { name: 'Deadlift', category: 'Pull', muscle: 'Hamstrings', equipment: 'Barbell' },
    { name: 'Overhead Press', category: 'Push', muscle: 'Shoulders', equipment: 'Barbell' },
    { name: 'Barbell Row', category: 'Pull', muscle: 'Back', equipment: 'Barbell' },
    { name: 'Pull-up', category: 'Pull', muscle: 'Lats', equipment: 'Bodyweight' },
    { name: 'Leg Press', category: 'Legs', muscle: 'Quads', equipment: 'Machine' },
    { name: 'Romanian Deadlift', category: 'Pull', muscle: 'Hamstrings', equipment: 'Barbell' },
    { name: 'Incline DB Press', category: 'Push', muscle: 'Chest', equipment: 'Dumbbell' },
    { name: 'Cable Fly', category: 'Push', muscle: 'Chest', equipment: 'Cable' },
    { name: 'Lat Pulldown', category: 'Pull', muscle: 'Lats', equipment: 'Cable' },
    { name: 'Face Pull', category: 'Pull', muscle: 'Rear Delt', equipment: 'Cable' },
    { name: 'Tricep Pushdown', category: 'Push', muscle: 'Triceps', equipment: 'Cable' },
    { name: 'Bicep Curl', category: 'Pull', muscle: 'Biceps', equipment: 'Dumbbell' },
    { name: 'Leg Curl', category: 'Legs', muscle: 'Hamstrings', equipment: 'Machine' },
    { name: 'Calf Raise', category: 'Legs', muscle: 'Calves', equipment: 'Machine' },
    { name: 'Plank', category: 'Core', muscle: 'Abs', equipment: 'Bodyweight' },
    { name: 'Ab Wheel', category: 'Core', muscle: 'Abs', equipment: 'Bodyweight' },
    { name: 'Hip Thrust', category: 'Legs', muscle: 'Glutes', equipment: 'Barbell' },
    { name: 'Lunges', category: 'Legs', muscle: 'Quads', equipment: 'Dumbbell' },
  ]

  const createdExercises: Record<string, string> = {}
  for (const ex of exercises) {
    const e = await prisma.exercise.create({ data: { ...ex, trainerId: trainer.id } })
    createdExercises[ex.name] = e.id
  }

  const program = await prisma.program.create({
    data: { name: 'Strength Block A', trainerId: trainer.id },
  })

  const w1 = await prisma.workout.create({
    data: { name: 'Day 1 — Upper Push', programId: program.id, dayIndex: 0 },
  })
  const w2 = await prisma.workout.create({
    data: { name: 'Day 2 — Lower', programId: program.id, dayIndex: 1 },
  })
  const w3 = await prisma.workout.create({
    data: { name: 'Day 3 — Upper Pull', programId: program.id, dayIndex: 2 },
  })

  await prisma.workoutExercise.createMany({
    data: [
      { workoutId: w1.id, exerciseId: createdExercises['Bench Press'], sets: 4, reps: '5', rpe: '8', order: 0 },
      { workoutId: w1.id, exerciseId: createdExercises['Overhead Press'], sets: 3, reps: '8', rpe: '7', order: 1 },
      { workoutId: w1.id, exerciseId: createdExercises['Incline DB Press'], sets: 3, reps: '10-12', rpe: '7', order: 2 },
      { workoutId: w1.id, exerciseId: createdExercises['Tricep Pushdown'], sets: 3, reps: '12-15', rpe: '6', order: 3 },
      { workoutId: w2.id, exerciseId: createdExercises['Squat'], sets: 4, reps: '5', rpe: '8', order: 0 },
      { workoutId: w2.id, exerciseId: createdExercises['Leg Press'], sets: 3, reps: '10', rpe: '7', order: 1 },
      { workoutId: w2.id, exerciseId: createdExercises['Romanian Deadlift'], sets: 3, reps: '8', rpe: '7', order: 2 },
      { workoutId: w2.id, exerciseId: createdExercises['Leg Curl'], sets: 3, reps: '12', rpe: '6', order: 3 },
      { workoutId: w2.id, exerciseId: createdExercises['Calf Raise'], sets: 4, reps: '15', rpe: '6', order: 4 },
      { workoutId: w3.id, exerciseId: createdExercises['Deadlift'], sets: 4, reps: '3', rpe: '8', order: 0 },
      { workoutId: w3.id, exerciseId: createdExercises['Barbell Row'], sets: 4, reps: '6', rpe: '8', order: 1 },
      { workoutId: w3.id, exerciseId: createdExercises['Lat Pulldown'], sets: 3, reps: '10', rpe: '7', order: 2 },
      { workoutId: w3.id, exerciseId: createdExercises['Face Pull'], sets: 3, reps: '15', rpe: '6', order: 3 },
      { workoutId: w3.id, exerciseId: createdExercises['Bicep Curl'], sets: 3, reps: '12', rpe: '6', order: 4 },
    ],
  })

  await prisma.assignedProgram.create({
    data: { clientProfileId: cp1.id, programId: program.id },
  })

  // Seed some workout logs for client 1
  const log1 = await prisma.workoutLog.create({
    data: { userId: c1User.id, workoutId: w1.id, completed: true, date: new Date(Date.now() - 7 * 86400000) },
  })
  await prisma.workoutSetLog.createMany({
    data: [
      { workoutLogId: log1.id, exerciseId: createdExercises['Bench Press'], setNumber: 1, weight: 100, reps: 5, rpe: 8 },
      { workoutLogId: log1.id, exerciseId: createdExercises['Bench Press'], setNumber: 2, weight: 100, reps: 5, rpe: 8 },
      { workoutLogId: log1.id, exerciseId: createdExercises['Bench Press'], setNumber: 3, weight: 100, reps: 4, rpe: 9 },
      { workoutLogId: log1.id, exerciseId: createdExercises['Bench Press'], setNumber: 4, weight: 95, reps: 5, rpe: 8 },
    ],
  })

  const log2 = await prisma.workoutLog.create({
    data: { userId: c1User.id, workoutId: w2.id, completed: true, date: new Date(Date.now() - 5 * 86400000) },
  })
  await prisma.workoutSetLog.createMany({
    data: [
      { workoutLogId: log2.id, exerciseId: createdExercises['Squat'], setNumber: 1, weight: 120, reps: 5, rpe: 8 },
      { workoutLogId: log2.id, exerciseId: createdExercises['Squat'], setNumber: 2, weight: 120, reps: 5, rpe: 8 },
      { workoutLogId: log2.id, exerciseId: createdExercises['Squat'], setNumber: 3, weight: 120, reps: 5, rpe: 9 },
    ],
  })

  const log3 = await prisma.workoutLog.create({
    data: { userId: c2User.id, workoutId: w1.id, completed: true, date: new Date(Date.now() - 3 * 86400000) },
  })
  await prisma.workoutSetLog.createMany({
    data: [
      { workoutLogId: log3.id, exerciseId: createdExercises['Bench Press'], setNumber: 1, weight: 60, reps: 8, rpe: 7 },
      { workoutLogId: log3.id, exerciseId: createdExercises['Bench Press'], setNumber: 2, weight: 60, reps: 8, rpe: 7 },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
