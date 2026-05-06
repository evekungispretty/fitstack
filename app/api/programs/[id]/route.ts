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
  const program = await prisma.program.findFirst({
    where: { id, trainerId: (session.user as any).id },
    include: {
      workouts: {
        include: {
          exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
        },
        orderBy: { dayIndex: 'asc' },
      },
      assigned: {
        where: { active: true },
        include: { clientProfile: { include: { user: { select: { name: true } } } } },
      },
    },
  })
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(program)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const program = await prisma.program.update({
    where: { id, trainerId: (session.user as any).id },
    data: { name: body.name },
  })
  return NextResponse.json(program)
}
