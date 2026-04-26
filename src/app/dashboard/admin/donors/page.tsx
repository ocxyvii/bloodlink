import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { DonorsClient } from './donors-client'

export default async function DonorsPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  // Get donors who have donated at this center
  const donationsQuery = supabase
    .from('donations')
    .select('donor_id, status, blood_type, donation_date')
    .eq('status', 'completed')

  if (center) donationsQuery.eq('center_id', center.id)

  const { data: donations } = await donationsQuery

  // Get unique donor IDs for this center
  const donorIds = center
    ? [...new Set((donations ?? []).map(d => d.donor_id))]
    : null

  const donorsQuery = supabase
    .from('profiles')
    .select('*')
    .eq('is_donor', true)
    .order('created_at', { ascending: false })

  if (donorIds && donorIds.length > 0) {
    donorsQuery.in('id', donorIds)
  } else if (donorIds && donorIds.length === 0) {
    // No donors at this center yet
    return (
      <div className="p-8">
        <div className="text-center py-16 bg-card rounded-2xl border text-muted-foreground max-w-lg mx-auto">
          <p className="font-medium">No donors at {center?.name} yet</p>
          <p className="text-sm mt-1">Donors who have completed donations here will appear.</p>
        </div>
      </div>
    )
  }

  const { data: donors } = await donorsQuery

  return (
    <div className="space-y-0">
      {center && (
        <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing donors who have donated at <strong className="text-foreground">{center.name}</strong>
          </span>
        </div>
      )}
      <DonorsClient donors={donors ?? []} donations={donations ?? []} />
    </div>
  )
}