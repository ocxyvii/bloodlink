import { createClient } from '@/lib/supabase/server'
import { MyDonationsClient } from './my-donations-client'

export default async function MyDonationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: donations }, { data: centers }] = await Promise.all([
    supabase
      .from('donations')
      .select('*, center:blood_centers(id, name, city, address, phone)')
      .eq('donor_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('blood_centers')
      .select('id, name, city, address, phone, operating_hours')
      .eq('is_active', true)
      .order('name'),
  ])

  return <MyDonationsClient donations={donations ?? []} centers={centers ?? []} />
}