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
  const { programId } = await req.json()

  const profile = await prisma.clientProfile.findUnique({ where: { userId: id } })
  if (!profile) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  await prisma.assignedProgram.updateMany({
    where: { clientProfileId: profile.id, active: true },
    data: { active: false },
  })

  const assigned = await prisma.assignedProgram.create({
    data: { clientProfileId: profile.id, programId },
  })
  return NextResponse.json(assigned, { status: 201 })
}
