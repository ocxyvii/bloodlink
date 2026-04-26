import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserNotificationListener } from '@/components/layout/user-notification-listener'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <UserSidebar profile={profile}>
      <UserNotificationListener />
      {children}
    </UserSidebar>
  )
}