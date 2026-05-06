import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const client = await prisma.clientProfile.findFirst({
    where: { userId: id, trainerId: (session.user as any).id },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      assignedPrograms: {
        include: {
          program: {
            include: {
              workouts: {
                include: {
                  exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
                  logs: {
                    where: { userId: id },
                    orderBy: { date: 'desc' },
                    take: 1,
                  },
                },
                orderBy: { dayIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const profile = await prisma.clientProfile.update({
    where: { userId: id },
    data: {
      notes: body.notes !== undefined ? body.notes : undefined,
      goal: body.goal !== undefined ? body.goal : undefined,
      currentWeight: body.currentWeight !== undefined ? Number(body.currentWeight) : undefined,
      targetWeight: body.targetWeight !== undefined ? Number(body.targetWeight) : undefined,
    },
  })
  return NextResponse.json(profile)
}
