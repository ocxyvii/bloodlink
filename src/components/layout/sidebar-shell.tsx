'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LogOut, Menu, X, Bell, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Profile } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
}

interface SidebarShellProps {
  profile: Profile
  navItems: NavItem[]
  role: string
  roleColor: string
  children: React.ReactNode
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <Badge
              variant={isActive ? 'secondary' : 'outline'}
              className="text-xs h-5 px-1.5 ml-auto"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  )
}

function SidebarContent({
  profile,
  navItems,
  role,
  roleColor,
  collapsed,
  onClose,
}: {
  profile: Profile
  navItems: NavItem[]
  role: string
  roleColor: string
  collapsed: boolean
  onClose?: () => void
}) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 mb-2', collapsed ? 'justify-center' : '')}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-base tracking-tight">BloodLink</span>
            <div className={cn('text-xs font-medium px-1.5 py-0.5 rounded-md w-fit mt-0.5', roleColor)}>
              {role}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href} onClick={onClose}>
            <NavLink item={item} collapsed={collapsed} />
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className={cn('p-3 border-t mt-2', collapsed ? 'flex justify-center' : '')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'flex items-center gap-3 w-full rounded-xl p-2 hover:bg-muted transition-colors text-left',
              collapsed ? 'justify-center w-auto' : ''
            )}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
              )}
              {!collapsed && <ChevronRight size={14} className="text-muted-foreground" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground font-normal">{profile.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut size={14} className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function SidebarShell({ profile, navItems, role, roleColor, children }: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r bg-card transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent
          profile={profile}
          navItems={navItems}
          role={role}
          roleColor={roleColor}
          collapsed={collapsed}
        />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 bg-card border border-l-0 rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
          style={{ left: collapsed ? '64px' : '256px' }}
        >
          <ChevronRight size={12} className={cn('transition-transform', collapsed ? '' : 'rotate-180')} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent
                profile={profile}
                navItems={navItems}
                role={role}
                roleColor={roleColor}
                collapsed={false}
                onClose={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Page title from pathname */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}