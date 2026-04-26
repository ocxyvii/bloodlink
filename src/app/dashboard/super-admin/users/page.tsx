import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './users-client'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  const { data: requestCounts } = await supabase
    .from('blood_requests')
    .select('requester_id')

  const { data: donationCounts } = await supabase
    .from('donations')
    .select('donor_id')

  return (
    <UsersClient
      users={users ?? []}
      requestCounts={requestCounts ?? []}
      donationCounts={donationCounts ?? []}
    />
  )
}