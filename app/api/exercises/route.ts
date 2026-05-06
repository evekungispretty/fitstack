import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const trainerId = (session.user as any).role === 'TRAINER'
    ? (session.user as any).id
    : (await prisma.clientProfile.findUnique({
        where: { userId: (session.user as any).id },
        select: { trainerId: true },
      }))?.trainerId

  if (!trainerId) return NextResponse.json([], { status: 200 })

  const exercises = await prisma.exercise.findMany({
    where: { trainerId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(exercises)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const exercise = await prisma.exercise.create({
    data: {
      name: body.name,
      category: body.category,
      muscle: body.muscle,
      equipment: body.equipment || null,
      description: body.description || null,
      trainerId: (session.user as any).id,
    },
  })
  return NextResponse.json(exercise, { status: 201 })
}
