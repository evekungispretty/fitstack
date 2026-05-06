import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const exercise = await prisma.exercise.update({
    where: { id, trainerId: (session.user as any).id },
    data: {
      name: body.name,
      category: body.category,
      muscle: body.muscle,
      equipment: body.equipment || null,
      description: body.description || null,
    },
  })
  return NextResponse.json(exercise)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.exercise.delete({
    where: { id, trainerId: (session.user as any).id },
  })
  return NextResponse.json({ ok: true })
}
