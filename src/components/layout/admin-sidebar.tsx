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

export function AdminSidebar({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <SidebarShell
      profile={profile}
      navItems={navItems}
      role="Admin"
      roleColor="bg-orange-100 text-orange-700"
    >
      {children}
    </SidebarShell>
  )
}