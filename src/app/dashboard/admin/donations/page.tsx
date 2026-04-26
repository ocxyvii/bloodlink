import { createClient } from '@/lib/supabase/server'
import { DonationsClient } from './donations-client'

export default async function DonationsPage() {
  const supabase = await createClient()

  const [{ data: donations }, { data: centers }] = await Promise.all([
    supabase
      .from('donations')
      .select('*, donor:profiles(id, full_name, email, phone, blood_type), center:blood_centers(id, name, city)')
      .order('created_at', { ascending: false }),
    supabase
      .from('blood_centers')
      .select('id, name, city')
      .eq('is_active', true),
  ])

  return <DonationsClient donations={donations ?? []} centers={centers ?? []} />
}