import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Providers from '@/components/layout/Providers'
import AppLayout from '@/components/layout/AppLayout'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'CLIENT') redirect('/login')

  return (
    <Providers>
      <AppLayout role="CLIENT">{children}</AppLayout>
    </Providers>
  )
}
