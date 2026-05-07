import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: clientUserId } = await params
  const body = await req.json()

  const client = await prisma.clientProfile.findFirst({
    where: { userId: clientUserId, trainerId: (session.user as any).id },
    include: {
      user: { select: { name: true } },
      assignedPrograms: {
        where: { active: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  let programId: string

  if (client.assignedPrograms.length > 0) {
    programId = client.assignedPrograms[0].programId
  } else {
    const program = await prisma.program.create({
      data: {
        name: `${client.user.name}'s Training`,
        trainerId: (session.user as any).id,
      },
    })
    await prisma.assignedProgram.create({
      data: { clientProfileId: client.id, programId: program.id },
    })
    programId = program.id
  }

  const count = await prisma.workout.count({ where: { programId } })
  const workout = await prisma.workout.create({
    data: {
      name: body.name || `Day ${count + 1}`,
      programId,
      dayIndex: count,
    },
  })

  return NextResponse.json({ ...workout, programId }, { status: 201 })
}
