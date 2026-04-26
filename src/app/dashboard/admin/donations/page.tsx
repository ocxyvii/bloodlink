import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { DonationsClient } from './donations-client'
import { AlertTriangle } from 'lucide-react'

export default async function DonationsPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  const donationsQuery = supabase
    .from('donations')
    .select('*, donor:profiles(id, full_name, email, phone, blood_type), center:blood_centers(id, name, city)')
    .order('created_at', { ascending: false })

  if (center) donationsQuery.eq('center_id', center.id)

  const [{ data: donations }, { data: centers }] = await Promise.all([
    donationsQuery,
    supabase.from('blood_centers').select('id, name, city').eq('is_active', true),
  ])

  return (
    <div className="space-y-0">
      {center && (
        <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-primary" />
          <span className="text-sm text-muted-foreground">
            Showing donations for <strong className="text-foreground">{center.name}</strong> only
          </span>
        </div>
      )}
      <DonationsClient
        donations={donations ?? []}
        centers={center ? centers?.filter(c => c.id === center.id) ?? [] : centers ?? []}
      />
    </div>
  )
}