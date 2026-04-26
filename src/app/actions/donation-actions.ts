'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function scheduleDonation(data: {
  center_id: string
  donation_date: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('blood_type, is_donor')
    .eq('id', user.id)
    .single()

  if (!profile?.blood_type) return { error: 'Please set your blood type in your profile first' }

  const adminClient = createAdminClient()

  const { data: donation, error } = await adminClient
    .from('donations')
    .insert({
      donor_id: user.id,
      center_id: data.center_id,
      blood_type: profile.blood_type,
      units_donated: 1,
      donation_date: data.donation_date,
      status: 'scheduled',
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Mark user as donor if not already
  if (!profile.is_donor) {
    await adminClient
      .from('profiles')
      .update({ is_donor: true })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard/user/my-donations')
  revalidatePath('/dashboard/admin/donations')
  return { success: true, id: donation.id }
}

export async function updateDonationStatus(
  donationId: string,
  status: string,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: donation, error } = await adminClient
    .from('donations')
    .update({ status, notes: notes || null })
    .eq('id', donationId)
    .select('*, donor:profiles(id, blood_type)')
    .single()

  if (error) return { error: error.message }

  // If completed, add units to inventory
  if (status === 'completed' && donation.center_id && donation.donor?.blood_type) {
    const { data: inv } = await adminClient
      .from('blood_inventory')
      .select('units_available')
      .eq('center_id', donation.center_id)
      .eq('blood_type', donation.donor.blood_type)
      .single()

    if (inv) {
      await adminClient
        .from('blood_inventory')
        .update({
          units_available: inv.units_available + donation.units_donated,
          last_updated: new Date().toISOString(),
        })
        .eq('center_id', donation.center_id)
        .eq('blood_type', donation.donor.blood_type)
    }

    // Notify donor
    await adminClient.from('notifications').insert({
      user_id: donation.donor_id,
      title: 'Donation Completed 🎉',
      message: `Thank you! Your blood donation of ${donation.units_donated} unit(s) has been recorded. You are saving lives!`,
      type: 'success',
    })
  }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: `DONATION_${status.toUpperCase()}`,
    table_name: 'donations',
    record_id: donationId,
  })

  revalidatePath('/dashboard/admin/donations')
  revalidatePath('/dashboard/user/my-donations')
  return { success: true }
}

export async function cancelDonation(donationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('donations')
    .update({ status: 'cancelled' })
    .eq('id', donationId)
    .eq('donor_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/user/my-donations')
  return { success: true }
}

export async function updateProfile(data: {
  full_name: string
  phone?: string
  location?: string
  date_of_birth?: string
  blood_type?: string
  is_donor?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone || null,
      location: data.location || null,
      date_of_birth: data.date_of_birth || null,
      blood_type: data.blood_type || null,
      is_donor: data.is_donor ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/user/profile')
  revalidatePath('/dashboard/user')
  return { success: true }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/user/notifications')
  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/dashboard/user/notifications')
  return { success: true }
}

export async function getUnreadNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', notifications: [] }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return { error: error.message, notifications: [] }
  return { notifications: data ?? [] }
}

export async function markNotificationsAsRead(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', ids)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/user/notifications')
  return { success: true }
}