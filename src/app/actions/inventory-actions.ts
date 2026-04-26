'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateInventory(id: string, data: {
  units_available: number
  units_reserved: number
  expiry_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('blood_inventory')
    .update({
      units_available: data.units_available,
      units_reserved: data.units_reserved,
      expiry_date: data.expiry_date || null,
      last_updated: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'UPDATE_INVENTORY',
    table_name: 'blood_inventory',
    record_id: id,
    new_data: data,
  })

  revalidatePath('/dashboard/admin/inventory')
  revalidatePath('/dashboard/super-admin/inventory')
  return { success: true }
}

export async function addInventoryEntry(data: {
  center_id: string
  blood_type: string
  units_available: number
  units_reserved: number
  expiry_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Upsert — if entry exists for this center+blood_type, update it
  const { error } = await adminClient
    .from('blood_inventory')
    .upsert({
      center_id: data.center_id,
      blood_type: data.blood_type,
      units_available: data.units_available,
      units_reserved: data.units_reserved,
      expiry_date: data.expiry_date || null,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'center_id,blood_type',
    })

  if (error) return { error: error.message }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'ADD_INVENTORY',
    table_name: 'blood_inventory',
    new_data: data,
  })

  revalidatePath('/dashboard/admin/inventory')
  revalidatePath('/dashboard/super-admin/inventory')
  return { success: true }
}

export async function deleteInventoryEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'super_admin'].includes(actor?.role)) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('blood_inventory')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/inventory')
  revalidatePath('/dashboard/super-admin/inventory')
  return { success: true }
}