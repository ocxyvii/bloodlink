import {
  LayoutDashboard, Droplets, MapPin,
  ClipboardList, Heart, Bell, User
} from 'lucide-react'
import { SidebarShell, NavItem } from './sidebar-shell'
import { Profile } from '@/types'

const navItems: NavItem[] = [
  { label: 'Overview',         href: '/dashboard/user',                icon: <LayoutDashboard size={18} /> },
  { label: 'Request Blood',    href: '/dashboard/user/request',        icon: <Droplets size={18} /> },
  { label: 'Find Centers',     href: '/dashboard/user/centers',        icon: <MapPin size={18} /> },
  { label: 'My Requests',      href: '/dashboard/user/my-requests',    icon: <ClipboardList size={18} /> },
  { label: 'My Donations',     href: '/dashboard/user/my-donations',   icon: <Heart size={18} /> },
  { label: 'Notifications',    href: '/dashboard/user/notifications',  icon: <Bell size={18} /> },
  { label: 'My Profile',       href: '/dashboard/user/profile',        icon: <User size={18} /> },
]

export function UserSidebar({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <SidebarShell
      profile={profile}
      navItems={navItems}
      role="Member"
      roleColor="bg-green-100 text-green-700"
    >
      {children}
    </SidebarShell>
  )
}