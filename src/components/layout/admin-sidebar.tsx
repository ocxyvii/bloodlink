import {
  LayoutDashboard, Droplets, Building2,
  ClipboardList, Users, BarChart3, CalendarPlus
} from 'lucide-react'
import { SidebarShell, NavItem } from './sidebar-shell'
import { Profile } from '@/types'

const navItems: NavItem[] = [
  { label: 'Overview',       href: '/dashboard/admin',            icon: <LayoutDashboard size={18} /> },
  { label: 'Blood Inventory',href: '/dashboard/admin/inventory',  icon: <Droplets size={18} /> },
  { label: 'Blood Centers',  href: '/dashboard/admin/centers',    icon: <Building2 size={18} /> },
  { label: 'Blood Requests', href: '/dashboard/admin/requests',   icon: <ClipboardList size={18} /> },
  { label: 'Donations',      href: '/dashboard/admin/donations',  icon: <CalendarPlus size={18} /> },
  { label: 'Donors',         href: '/dashboard/admin/donors',     icon: <Users size={18} /> },
  { label: 'Reports',        href: '/dashboard/admin/reports',    icon: <BarChart3 size={18} /> },
]

interface AdminSidebarProps {
  profile: Profile
  center?: { id: string; name: string; city: string } | null
  children: React.ReactNode
}

export function AdminSidebar({ profile, center, children }: AdminSidebarProps) {
  return (
    <SidebarShell
      profile={profile}
      navItems={navItems}
      role={center ? `${center.name}` : 'Admin — No Center'}
      roleColor={center ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}
    >
      {children}
    </SidebarShell>
  )
}