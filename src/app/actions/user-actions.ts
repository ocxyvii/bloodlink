'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { error: 'Only super admins can delete users' }
  }

  const adminClient = createAdminClient()

  // Delete user from auth
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) return { error: authError.message }

  // Delete user's profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) return { error: profileError.message }

  // Delete user's requests
  const { error: requestError } = await adminClient
    .from('blood_requests')
    .delete()
    .eq('requester_id', userId)

  // Delete user's donations
  const { error: donationError } = await adminClient
    .from('donations')
    .delete()
    .eq('donor_id', userId)

  // Delete user's notifications
  const { error: notificationError } = await adminClient
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  // Log the deletion
  await adminClient.from('audit_logs').insert({
    actor_id:   user.id,
    action:     'USER_DELETED',
    table_name: 'profiles',
    record_id:  userId,
    new_data:   { deleted: true },
  })

  revalidatePath('/dashboard/super-admin/users')
  return { success: true }
}
