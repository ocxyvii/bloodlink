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

  // Sanitize center_id — treat "any", "none", "" as null
  const centerId =
    !data.center_id ||
    data.center_id === 'any' ||
    data.center_id === 'none' ||
    data.center_id.trim() === ''
      ? null
      : data.center_id

  const { data: request, error } = await adminClient
    .from('blood_requests')
    .insert({
      requester_id:  user.id,
      blood_type:    data.blood_type,
      units_needed:  data.units_needed,
      urgency:       data.urgency,
      hospital_name: data.hospital_name,
      patient_name:  data.patient_name,
      reason:        data.reason || null,
      center_id:     centerId,
      status:        'pending',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Smart notification routing
  const notificationsToAdd: any[] = []
  
  if (centerId) {
    // If a specific center is selected, notify the assigned admin
    const { data: centerAdmin } = await adminClient
      .from('blood_centers')
      .select('admin_id')
      .eq('id', centerId)
      .single()
    
    if (centerAdmin?.admin_id) {
      notificationsToAdd.push({
        user_id: centerAdmin.admin_id,
        title:   data.urgency === 'emergency'
          ? '🚨 Emergency Blood Request'
          : 'New Blood Request',
        message: `${data.urgency === 'emergency' ? 'URGENT: ' : ''}${data.blood_type} blood needed (${data.units_needed} units) for ${data.patient_name} at ${data.hospital_name}`,
        type:    data.urgency === 'emergency' ? 'emergency' : 'info',
      })
    } else {
      // No admin assigned to this center, notify super admins
      const { data: superAdmins } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin')
        .eq('is_active', true)
      
      if (superAdmins) {
        notificationsToAdd.push(...superAdmins.map(sa => ({
          user_id: sa.id,
          title:   data.urgency === 'emergency'
            ? '🚨 Emergency Blood Request (Unassigned Center)'
            : 'New Blood Request (Unassigned Center)',
          message: `${data.urgency === 'emergency' ? 'URGENT: ' : ''}${data.blood_type} blood needed (${data.units_needed} units) for ${data.patient_name} at ${data.hospital_name} - No admin assigned to center`,
          type:    data.urgency === 'emergency' ? 'emergency' : 'warning',
        })))
      }
    }
  } else {
    // No specific center selected, notify all super admins
    const { data: superAdmins } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .eq('is_active', true)
    
    if (superAdmins) {
      notificationsToAdd.push(...superAdmins.map(sa => ({
        user_id: sa.id,
        title:   data.urgency === 'emergency'
          ? '🚨 Emergency Blood Request (Any Center)'
          : 'New Blood Request (Any Center)',
        message: `${data.urgency === 'emergency' ? 'URGENT: ' : ''}${data.blood_type} blood needed (${data.units_needed} units) for ${data.patient_name} at ${data.hospital_name} - Patient willing to go to any center`,
        type:    data.urgency === 'emergency' ? 'emergency' : 'info',
      })))
    }
  }
  
  // Insert notifications
  if (notificationsToAdd.length > 0) {
    await adminClient.from('notifications').insert(notificationsToAdd)
  }

  revalidatePath('/dashboard/user/my-requests')
  revalidatePath('/dashboard/admin/requests')
  revalidatePath('/dashboard/super-admin/requests')
  return { success: true, id: request.id }
}

export async function updateRequestStatus(
  requestId: string,
  status: string,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: request, error } = await adminClient
    .from('blood_requests')
    .update({
      status,
      notes:             notes || null,
      assigned_admin_id: user.id,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  // Fetch requester information separately to avoid relationship conflicts
  let requester = null
  if (request.requester_id) {
    const { data: requesterData } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', request.requester_id)
      .single()
    requester = requesterData
  }

  // If fulfilled — deduct from inventory (only from available units)
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
          last_updated:    new Date().toISOString(),
        })
        .eq('center_id', request.center_id)
        .eq('blood_type', request.blood_type)
    }
  }

  // Notify requester
  const statusMessages: Record<string, { title: string; message: string; type: string }> = {
    approved:  {
      title:   'Request Approved ✅',
      message: `Your ${request.blood_type} blood request (${request.units_needed} units) has been approved.`,
      type:    'success',
    },
    rejected:  {
      title:   'Request Rejected',
      message: `Your ${request.blood_type} blood request has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
      type:    'warning',
    },
    fulfilled: {
      title:   'Request Fulfilled 🎉',
      message: `Your ${request.blood_type} blood request (${request.units_needed} units) has been fulfilled.`,
      type:    'success',
    },
  }

  const notif = statusMessages[status]
  if (notif && requester) {
    await adminClient.from('notifications').insert({
      user_id: requester.id,
      title:   notif.title,
      message: notif.message,
      type:    notif.type,
    })
  }

  await adminClient.from('audit_logs').insert({
    actor_id:   user.id,
    action:     `REQUEST_${status.toUpperCase()}`,
    table_name: 'blood_requests',
    record_id:  requestId,
    new_data:   { status, notes },
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
      status:     'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/user/my-requests')
  return { success: true }
}

export async function deleteRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { error: 'Only super admins can delete requests' }
  }

  const { error } = await adminClient
    .from('blood_requests')
    .delete()
    .eq('id', requestId)

  if (error) return { error: error.message }

  // Log the deletion
  await adminClient.from('audit_logs').insert({
    actor_id:   user.id,
    action:     'REQUEST_DELETED',
    table_name: 'blood_requests',
    record_id:  requestId,
    new_data:   { deleted: true },
  })

  revalidatePath('/dashboard/admin/requests')
  revalidatePath('/dashboard/super-admin/requests')
  revalidatePath('/dashboard/user/my-requests')
  return { success: true }
}