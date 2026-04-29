'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function changeAdminPassword(adminId: string, newPassword: string) {
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
    return { error: 'Only super admins can change admin passwords' }
  }

  // Validate the target user is an admin
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', adminId)
    .single()

  if (!targetUser || targetUser.role !== 'admin') {
    return { error: 'Target user is not an admin' }
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  const adminClient = createAdminClient()

  // Update the admin's password in auth
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    adminId,
    { password: newPassword }
  )

  if (authError) return { error: authError.message }

  // Log the password change
  await adminClient.from('audit_logs').insert({
    actor_id:   user.id,
    action:     'ADMIN_PASSWORD_CHANGED',
    table_name: 'auth.users',
    record_id:  adminId,
    new_data:   { 
      admin_name: targetUser.full_name,
      changed_by: user.id 
    },
  })

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}
