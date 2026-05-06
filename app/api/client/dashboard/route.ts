import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id

  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: {
      assignedPrograms: {
        where: { active: true },
        include: {
          program: {
            include: {
              workouts: { include: { exercises: true }, orderBy: { dayIndex: 'asc' } },
            },
          },
        },
        take: 1,
      },
    },
  })

  const recentLogs = await prisma.workoutLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 5,
    include: { workout: { select: { name: true } } },
  })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const workoutsThisMonth = await prisma.workoutLog.count({
    where: { userId, completed: true, date: { gte: startOfMonth } },
  })

  return NextResponse.json({ profile, recentLogs, workoutsThisMonth })
}
