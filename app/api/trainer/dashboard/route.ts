import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const trainerId = (session.user as any).id

  const clients = await prisma.clientProfile.findMany({
    where: { trainerId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedPrograms: {
        where: { active: true },
        include: { program: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  })

  const programs = await prisma.program.findMany({ where: { trainerId } })

  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const clientIds = clients.map((c) => c.userId)
  const workoutsThisWeek = await prisma.workoutLog.count({
    where: { userId: { in: clientIds }, completed: true, date: { gte: startOfWeek } },
  })

  const recentActivity = await prisma.workoutLog.findMany({
    where: { userId: { in: clientIds }, completed: true },
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true } },
      workout: { select: { name: true } },
    },
  })

  return NextResponse.json({
    totalClients: clients.length,
    totalPrograms: programs.length,
    workoutsThisWeek,
    clients,
    recentActivity,
  })
}
