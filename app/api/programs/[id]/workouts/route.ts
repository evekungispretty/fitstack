import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()

  const existing = await prisma.workout.findMany({ where: { programId: id } })
  const workout = await prisma.workout.create({
    data: {
      name: body.name || `Day ${existing.length + 1}`,
      programId: id,
      dayIndex: existing.length,
    },
  })
  return NextResponse.json(workout, { status: 201 })
}
