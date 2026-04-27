'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createAdmin(formData: {
  full_name: string
  email: string
  password: string
  phone?: string
  location?: string
  center_id?: string
  role?: 'admin' | 'super_admin'
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
  const assignedRole = formData.role ?? 'admin'

  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      role: assignedRole,
    },
  })

  if (authError) return { error: authError.message }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      role: assignedRole,
      full_name: formData.full_name,
      phone: formData.phone || null,
      location: formData.location || null,
    })
    .eq('id', newUser.user.id)

  if (profileError) return { error: profileError.message }

  // Only assign center for regular admins, not super admins
  if (formData.center_id && assignedRole === 'admin') {
    await adminClient
      .from('blood_centers')
      .update({ admin_id: newUser.user.id })
      .eq('id', formData.center_id)
  }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: assignedRole === 'super_admin' ? 'CREATE_SUPER_ADMIN' : 'CREATE_ADMIN',
    table_name: 'profiles',
    record_id: newUser.user.id,
    new_data: {
      email: formData.email,
      full_name: formData.full_name,
      role: assignedRole,
    },
  })

  revalidatePath('/dashboard/super-admin/admins')
  return { success: true }
}

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

  // Prevent deleting yourself
  if (adminId === user.id) return { error: 'You cannot delete your own account' }

  const adminClient = createAdminClient()

  // Unassign from any center first
  await adminClient
    .from('blood_centers')
    .update({ admin_id: null })
    .eq('admin_id', adminId)

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

  // Unassign from previous center
  await adminClient
    .from('blood_centers')
    .update({ admin_id: null })
    .eq('admin_id', adminId)

  // Assign to new center if provided
  if (formData.center_id && formData.center_id !== 'none') {
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