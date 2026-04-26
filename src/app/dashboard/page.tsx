import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'super_admin') redirect('/dashboard/super-admin')
  if (profile?.role === 'admin') redirect('/dashboard/admin')
  redirect('/dashboard/user')
}
