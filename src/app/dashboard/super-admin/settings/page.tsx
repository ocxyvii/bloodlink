import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single()

  const { count: totalUsers }    = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true })
  const { count: totalDonations } = await supabase.from('donations').select('*', { count: 'exact', head: true })
  const { count: totalCenters }  = await supabase.from('blood_centers').select('*', { count: 'exact', head: true })

  return (
    <SettingsClient
      profile={profile}
      stats={{ totalUsers, totalRequests, totalDonations, totalCenters }}
    />
  )
}