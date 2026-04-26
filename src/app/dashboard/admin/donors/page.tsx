import { createClient } from '@/lib/supabase/server'
import { DonorsClient } from './donors-client'

export default async function DonorsPage() {
  const supabase = await createClient()

  const [{ data: donors }, { data: donations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('is_donor', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('donations')
      .select('donor_id, status, blood_type, donation_date')
      .eq('status', 'completed'),
  ])

  return <DonorsClient donors={donors ?? []} donations={donations ?? []} />
}