export type UserRole = 'super_admin' | 'admin' | 'user'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled'

export type RequestUrgency = 'normal' | 'urgent' | 'emergency'

export type DonationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  blood_type: BloodType | null
  phone: string | null
  location: string | null
  date_of_birth: string | null
  is_donor: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BloodInventory {
  id: string
  center_id: string
  blood_type: BloodType
  units_available: number
  units_reserved: number
  expiry_date: string | null
  last_updated: string
  center?: BloodCenter
}

export interface BloodCenter {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string | null
  latitude: number | null
  longitude: number | null
  operating_hours: string | null
  is_active: boolean
  admin_id: string | null
  created_at: string
}

export interface BloodRequest {
  id: string
  requester_id: string
  blood_type: BloodType
  units_needed: number
  urgency: RequestUrgency
  status: RequestStatus
  hospital_name: string
  patient_name: string
  reason: string | null
  center_id: string | null
  assigned_admin_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  requester?: Profile
  center?: BloodCenter
}

export interface Donation {
  id: string
  donor_id: string
  center_id: string
  blood_type: BloodType
  units_donated: number
  donation_date: string
  status: DonationStatus
  notes: string | null
  created_at: string
  donor?: Profile
  center?: BloodCenter
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'emergency'
  is_read: boolean
  created_at: string
}