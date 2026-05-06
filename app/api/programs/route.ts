import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const programs = await prisma.program.findMany({
    where: { trainerId: (session.user as any).id },
    include: {
      _count: { select: { workouts: true, assigned: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const program = await prisma.program.create({
    data: { name: body.name, trainerId: (session.user as any).id },
  })
  return NextResponse.json(program, { status: 201 })
}
