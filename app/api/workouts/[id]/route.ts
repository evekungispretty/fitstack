import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
      program: { select: { name: true } },
    },
  })
  if (!workout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(workout)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()

  await prisma.workout.update({ where: { id }, data: { name: body.name } })

  if (body.exercises) {
    await prisma.workoutExercise.deleteMany({ where: { workoutId: id } })
    if (body.exercises.length > 0) {
      await prisma.workoutExercise.createMany({
        data: body.exercises.map((e: any, i: number) => ({
          workoutId: id,
          exerciseId: e.exerciseId,
          sets: Number(e.sets),
          reps: String(e.reps),
          rpe: e.rpe || null,
          notes: e.notes || null,
          order: i,
        })),
      })
    }
  }

  const updated = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.workout.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
