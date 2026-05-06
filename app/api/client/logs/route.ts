import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const logs = await prisma.workoutLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: {
      workout: { select: { name: true } },
      sets: true,
    },
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await req.json()
  const { workoutId, sets, notes, completed } = body

  const existing = await prisma.workoutLog.findFirst({
    where: { userId, workoutId, completed: false },
  })

  if (existing) {
    if (sets && sets.length > 0) {
      await prisma.workoutSetLog.deleteMany({ where: { workoutLogId: existing.id } })
      await prisma.workoutSetLog.createMany({
        data: sets.map((s: any) => ({
          workoutLogId: existing.id,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          weight: s.weight ? Number(s.weight) : null,
          reps: s.reps ? Number(s.reps) : null,
          rpe: s.rpe ? Number(s.rpe) : null,
        })),
      })
    }
    if (completed !== undefined) {
      await prisma.workoutLog.update({
        where: { id: existing.id },
        data: { completed: Boolean(completed), notes: notes || null },
      })
    }
    return NextResponse.json(existing)
  }

  const log = await prisma.workoutLog.create({
    data: { userId, workoutId, notes: notes || null, completed: Boolean(completed) },
  })
  if (sets && sets.length > 0) {
    await prisma.workoutSetLog.createMany({
      data: sets.map((s: any) => ({
        workoutLogId: log.id,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weight: s.weight ? Number(s.weight) : null,
        reps: s.reps ? Number(s.reps) : null,
        rpe: s.rpe ? Number(s.rpe) : null,
      })),
    })
  }
  return NextResponse.json(log, { status: 201 })
}
