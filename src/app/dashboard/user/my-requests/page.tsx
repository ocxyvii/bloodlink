import { createClient } from '@/lib/supabase/server'
import { MyRequestsClient } from './my-requests-client'

export default async function MyRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('blood_requests')
    .select('*, center:blood_centers(name, city, phone)')
    .eq('requester_id', user!.id)
    .order('created_at', { ascending: false })

  return <MyRequestsClient requests={requests ?? []} />
}