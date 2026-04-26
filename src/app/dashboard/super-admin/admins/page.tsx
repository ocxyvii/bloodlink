import { createClient } from '@/lib/supabase/server'
import { ManageAdminsClient } from './manage-admins-client'

export default async function ManageAdminsPage() {
  const supabase = await createClient()

  const [
    { data: admins },
    { data: centers },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false }),
    supabase
      .from('blood_centers')
      .select('*')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <ManageAdminsClient
      admins={admins ?? []}
      centers={centers ?? []}
    />
  )
}