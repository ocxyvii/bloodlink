import { createClient } from '@/lib/supabase/server'

export async function getAdminCenter() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Super admin sees everything — return null to mean "no filter"
  if (profile?.role === 'super_admin') return null

  const { data: center } = await supabase
    .from('blood_centers')
    .select('*')
    .eq('admin_id', user.id)
    .single()

  return center ?? null
}