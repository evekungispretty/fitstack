import { NextRequest, NextResponse } from 'next/server'
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
      trainer: { select: { name: true } },
      assignedPrograms: {
        where: { active: true },
        include: { program: { select: { name: true } } },
      },
    },
  })
  return NextResponse.json(profile)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await req.json()
  const profile = await prisma.clientProfile.update({
    where: { userId },
    data: {
      currentWeight: body.currentWeight ? Number(body.currentWeight) : undefined,
      goal: body.goal || undefined,
    },
  })
  return NextResponse.json(profile)
}
