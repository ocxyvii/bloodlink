'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Create a new admin account
export async function createAdmin(formData: {
  full_name: string
  email: string
  password: string
  phone?: string
  location?: string
  center_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actor?.role !== 'super_admin') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Create auth user
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      role: 'admin',
    },
  })

  if (authError) return { error: authError.message }

  // Update profile with admin role and details
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      role: 'admin',
      full_name: formData.full_name,
      phone: formData.phone || null,
      location: formData.location || null,
    })
    .eq('id', newUser.user.id)

  if (profileError) return { error: profileError.message }

  // Assign to center if provided
  if (formData.center_id) {
    await adminClient
      .from('blood_centers')
      .update({ admin_id: newUser.user.id })
      .eq('id', formData.center_id)
  }

  // Log action
  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'CREATE_ADMIN',
    table_name: 'profiles',
    record_id: newUser.user.id,
    new_data: { email: formData.email, full_name: formData.full_name },
  })

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}

// Toggle admin active status
export async function toggleAdminStatus(adminId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', adminId)

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: isActive ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
    table_name: 'profiles',
    record_id: adminId,
  })

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}

// Delete admin account
export async function deleteAdmin(adminId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actor?.role !== 'super_admin') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'DELETE_ADMIN',
    table_name: 'profiles',
    record_id: adminId,
  })

  const { error } = await adminClient.auth.admin.deleteUser(adminId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}

// Update admin details
export async function updateAdmin(adminId: string, formData: {
  full_name: string
  phone?: string
  location?: string
  center_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({
      full_name: formData.full_name,
      phone: formData.phone || null,
      location: formData.location || null,
    })
    .eq('id', adminId)

  if (error) return { error: error.message }

  // Update center assignment
  // First unassign from any current center
  await adminClient
    .from('blood_centers')
    .update({ admin_id: null })
    .eq('admin_id', adminId)

  // Then assign to new center if provided
  if (formData.center_id) {
    await adminClient
      .from('blood_centers')
      .update({ admin_id: adminId })
      .eq('id', formData.center_id)
  }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'UPDATE_ADMIN',
    table_name: 'profiles',
    record_id: adminId,
    new_data: formData,
  })

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}