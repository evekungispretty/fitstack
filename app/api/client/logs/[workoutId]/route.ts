import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { workoutId } = await params
  const userId = (session.user as any).id
  const logs = await prisma.workoutLog.findMany({
    where: { userId, workoutId },
    orderBy: { date: 'desc' },
    include: { sets: true },
    take: 1,
  })
  return NextResponse.json(logs[0] || null)
}
