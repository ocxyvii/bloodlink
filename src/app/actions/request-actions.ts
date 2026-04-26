'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createBloodRequest(data: {
  blood_type: string
  units_needed: number
  urgency: string
  hospital_name: string
  patient_name: string
  reason?: string
  center_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: request, error } = await adminClient
    .from('blood_requests')
    .insert({
      requester_id: user.id,
      blood_type: data.blood_type,
      units_needed: data.units_needed,
      urgency: data.urgency,
      hospital_name: data.hospital_name,
      patient_name: data.patient_name,
      reason: data.reason || null,
      center_id: data.center_id || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Notify all admins about new request
  const { data: admins } = await adminClient
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'super_admin'])

  if (admins && admins.length > 0) {
    await adminClient.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        title: data.urgency === 'emergency'
          ? '🚨 Emergency Blood Request'
          : 'New Blood Request',
        message: `${data.urgency === 'emergency' ? 'URGENT: ' : ''}${data.blood_type} blood needed (${data.units_needed} units) for ${data.patient_name} at ${data.hospital_name}`,
        type: data.urgency === 'emergency' ? 'emergency' : 'info',
      }))
    )
  }

  revalidatePath('/dashboard/user/my-requests')
  revalidatePath('/dashboard/admin/requests')
  revalidatePath('/dashboard/super-admin/requests')
  return { success: true, id: request.id }
}

export async function updateRequestStatus(
  requestId: string,
  status: string,
  notes?: string,
  centerId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: actor } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return { error: 'Forbidden' }
  }

  const updateData: {
    status: string
    notes: string | null
    assigned_admin_id: string
    updated_at: string
    center_id?: string | null
  } = {
    status,
    notes: notes || null,
    assigned_admin_id: user.id,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updateData.center_id = centerId || null
  }

  const { data: request, error } = await adminClient
    .from('blood_requests')
    .update(updateData)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  // If approved, reserve units from inventory
  if (status === 'approved' && request.center_id) {
    const { data: inv } = await adminClient
      .from('blood_inventory')
      .select('units_reserved')
      .eq('center_id', request.center_id)
      .eq('blood_type', request.blood_type)
      .single()

    if (inv) {
      await adminClient
        .from('blood_inventory')
        .update({
          units_reserved: (inv.units_reserved ?? 0) + request.units_needed,
          last_updated: new Date().toISOString(),
        })
        .eq('center_id', request.center_id)
        .eq('blood_type', request.blood_type)
    }
  }

  // If fulfilled, deduct from inventory
  if (status === 'fulfilled' && request.center_id) {
    const { data: inv } = await adminClient
      .from('blood_inventory')
      .select('units_available, units_reserved')
      .eq('center_id', request.center_id)
      .eq('blood_type', request.blood_type)
      .single()

    if (inv) {
      await adminClient
        .from('blood_inventory')
        .update({
          units_available: Math.max(0, inv.units_available - request.units_needed),
          units_reserved: Math.max(0, inv.units_reserved - request.units_needed),
          last_updated: new Date().toISOString(),
        })
        .eq('center_id', request.center_id)
        .eq('blood_type', request.blood_type)
    }
  }

  // Notify requester
  const statusMessages: Record<string, { title: string; message: string; type: string }> = {
    approved:  { title: 'Request Approved ✅',  message: `Your blood request for ${request.blood_type} (${request.units_needed} units) has been approved.`, type: 'success' },
    rejected:  { title: 'Request Rejected',     message: `Your blood request for ${request.blood_type} has been rejected. ${notes ? `Reason: ${notes}` : ''}`, type: 'warning' },
    fulfilled: { title: 'Request Fulfilled 🎉', message: `Your blood request for ${request.blood_type} (${request.units_needed} units) has been fulfilled.`, type: 'success' },
  }

  const notif = statusMessages[status]
  if (notif && request.requester_id) {
    const { data: requesterProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', request.requester_id)
      .single()

    if (requesterProfile) {
      await adminClient.from('notifications').insert({
        user_id: requesterProfile.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
      })
    }
  }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: `REQUEST_${status.toUpperCase()}`,
    table_name: 'blood_requests',
    record_id: requestId,
    new_data: { status, notes },
  })

  revalidatePath('/dashboard/admin/requests')
  revalidatePath('/dashboard/super-admin/requests')
  revalidatePath('/dashboard/user/my-requests')
  return { success: true }
}

export async function cancelRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('blood_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/user/my-requests')
  return { success: true }
}