import {
  LayoutDashboard, Users, UserCog, Building2,
  Droplets, ClipboardList, BarChart3, Settings, ScrollText
} from 'lucide-react'
import { SidebarShell, NavItem } from './sidebar-shell'
import { Profile } from '@/types'

const navItems: NavItem[] = [
  { label: 'Overview',       href: '/dashboard/super-admin',          icon: <LayoutDashboard size={18} /> },
  { label: 'Manage Admins',  href: '/dashboard/super-admin/admins',   icon: <UserCog size={18} /> },
  { label: 'All Users',      href: '/dashboard/super-admin/users',    icon: <Users size={18} /> },
  { label: 'Blood Centers',  href: '/dashboard/super-admin/centers',  icon: <Building2 size={18} /> },
  { label: 'Blood Inventory',href: '/dashboard/super-admin/inventory',icon: <Droplets size={18} /> },
  { label: 'All Requests',   href: '/dashboard/super-admin/requests', icon: <ClipboardList size={18} /> },
  { label: 'Analytics',      href: '/dashboard/super-admin/analytics',icon: <BarChart3 size={18} /> },
  { label: 'Audit Logs',     href: '/dashboard/super-admin/audit',    icon: <ScrollText size={18} /> },
  { label: 'Settings',       href: '/dashboard/super-admin/settings', icon: <Settings size={18} /> },
]

export function SuperAdminSidebar({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <SidebarShell
      profile={profile}
      navItems={navItems}
      role="Super Admin"
      roleColor="bg-purple-100 text-purple-700"
    >
      {children}
    </SidebarShell>
  )
}