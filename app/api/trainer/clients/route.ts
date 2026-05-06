import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const trainerId = (session.user as any).id
  const clients = await prisma.clientProfile.findMany({
    where: { trainerId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      assignedPrograms: {
        where: { active: true },
        include: { program: { select: { id: true, name: true } } },
        take: 1,
      },
    },
    orderBy: { user: { createdAt: 'desc' } },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const trainerId = (session.user as any).id
  const body = await req.json()
  const { name, email, goal, startWeight, targetWeight, notes } = body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })

  const password = await bcrypt.hash('client123', 10)
  const user = await prisma.user.create({
    data: { name, email, password, role: 'CLIENT' },
  })
  const profile = await prisma.clientProfile.create({
    data: {
      userId: user.id,
      trainerId,
      goal: goal || null,
      notes: notes || null,
      startWeight: startWeight ? Number(startWeight) : null,
      currentWeight: startWeight ? Number(startWeight) : null,
      targetWeight: targetWeight ? Number(targetWeight) : null,
    },
  })
  return NextResponse.json({ user, profile }, { status: 201 })
}
