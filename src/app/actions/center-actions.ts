'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createCenter(data: {
  name: string
  address: string
  city: string
  country: string
  phone: string
  email?: string
  operating_hours?: string
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: center, error } = await adminClient
    .from('blood_centers')
    .insert({
      ...data,
      email: data.email || null,
      operating_hours: data.operating_hours || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'CREATE_CENTER',
    table_name: 'blood_centers',
    record_id: center.id,
    new_data: data,
  })

  // Auto-create inventory entries for all blood types
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  await adminClient.from('blood_inventory').insert(
    bloodTypes.map(bt => ({
      center_id: center.id,
      blood_type: bt,
      units_available: 0,
      units_reserved: 0,
    }))
  )

  revalidatePath('/dashboard/admin/centers')
  revalidatePath('/dashboard/super-admin/centers')
  return { success: true, id: center.id }
}

export async function updateCenter(id: string, data: {
  name: string
  address: string
  city: string
  country: string
  phone: string
  email?: string
  operating_hours?: string
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('blood_centers')
    .update({
      ...data,
      email: data.email || null,
      operating_hours: data.operating_hours || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'UPDATE_CENTER',
    table_name: 'blood_centers',
    record_id: id,
    new_data: data,
  })

  revalidatePath('/dashboard/admin/centers')
  revalidatePath('/dashboard/super-admin/centers')
  return { success: true }
}

export async function toggleCenterStatus(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('blood_centers')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: isActive ? 'ACTIVATE_CENTER' : 'DEACTIVATE_CENTER',
    table_name: 'blood_centers',
    record_id: id,
  })

  revalidatePath('/dashboard/admin/centers')
  revalidatePath('/dashboard/super-admin/centers')
  return { success: true }
}

export async function deleteCenter(id: string) {
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
    action: 'DELETE_CENTER',
    table_name: 'blood_centers',
    record_id: id,
  })

  const { error } = await adminClient
    .from('blood_centers')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/centers')
  revalidatePath('/dashboard/super-admin/centers')
  return { success: true }
}

export async function assignAdminToCenter(centerId: string, adminId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Unassign from previous center if any
  if (adminId) {
    await adminClient
      .from('blood_centers')
      .update({ admin_id: null })
      .eq('admin_id', adminId)
  }

  const { error } = await adminClient
    .from('blood_centers')
    .update({ admin_id: adminId })
    .eq('id', centerId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/centers')
  revalidatePath('/dashboard/super-admin/centers')
  return { success: true }
}