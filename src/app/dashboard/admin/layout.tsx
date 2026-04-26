import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({
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

  if (!['admin', 'super_admin'].includes(profile?.role)) {
    redirect('/dashboard/user')
  }

  // Get assigned center for this admin
  const { data: center } = await supabase
    .from('blood_centers')
    .select('id, name, city')
    .eq('admin_id', user.id)
    .single()

  return (
    <AdminSidebar profile={profile} center={center ?? null}>
      {children}
    </AdminSidebar>
  )
}