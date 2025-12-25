'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    Users,
    UserPlus,
    Settings,
    CalendarClock,
    MapPin,
    HardHat,
    LogOut,
    Shield,
    ChevronRight
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import '@/styles/sidebar.css'

interface SidebarProps {
    role: 'super_admin' | 'founder' | 'admin' | string
}

type MenuItem = {
    name: string
    href: string
    icon: React.ElementType
    subitems?: { name: string; href: string; icon: React.ElementType }[]
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const toggleItem = (name: string) => {
        setOpenItems(prev => ({ ...prev, [name]: !prev[name] }))
    }

    // Staff Menu (Super Admin Global)
    const staffMenu: MenuItem[] = [
        { name: 'Overview', href: '/staff', icon: LayoutDashboard },
        { name: 'Companies', href: '/staff/companies', icon: Building2 },
        { name: 'Projects', href: '/staff/projects', icon: Building2 },
        { name: 'Global Users', href: '/staff/users', icon: Users },
        { name: 'Invitations', href: '/staff/invitations', icon: UserPlus },
    ]

    // Management Menu (Founder + Admin)
    const managementMenu: MenuItem[] = [
        { name: 'Dashboard', href: '/founder', icon: LayoutDashboard },
        {
            name: 'Workforce', href: '/founder/workforce', icon: HardHat, subitems: [
                { name: 'Shifts', href: '/founder/workforce/shifts', icon: CalendarClock },
                { name: 'Crews', href: '/founder/workforce/crews', icon: Users },
            ]
        },
        {
            name: 'Operations', href: '/founder/config', icon: Settings, subitems: [
                { name: 'Locations', href: '/founder/config/locations', icon: MapPin },
            ]
        },
    ]

    const isManagement = ['founder', 'admin'].includes(role)
    const menuItems = role === 'super_admin' ? staffMenu : managementMenu

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <span className="sidebar-logo">LukeAPP</span>
                <span className={`sidebar-badge ${role === 'super_admin' ? 'staff' : 'management'}`}>
                    {role === 'super_admin' ? 'STAFF' : role.toUpperCase()}
                </span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    const hasSubitems = item.subitems && item.subitems.length > 0
                    const isOpen = openItems[item.name]

                    return (
                        <div key={item.name} className="sidebar-nav-group">
                            {/* Main Link */}
                            <Link
                                href={item.href}
                                className={`sidebar-link ${isActive ? 'active' : 'inactive'}`}
                                onClick={(e) => {
                                    if (hasSubitems) {
                                        e.preventDefault()
                                        toggleItem(item.name)
                                    }
                                }}
                            >
                                <item.icon className="sidebar-link-icon" />
                                <span className="sidebar-link-text">{item.name}</span>
                                {hasSubitems && (
                                    <ChevronRight className={`sidebar-link-chevron ${isOpen ? 'open' : ''}`} />
                                )}
                            </Link>

                            {/* Subitems */}
                            {hasSubitems && isOpen && (
                                <div className="sidebar-subitems">
                                    {item.subitems!.map((sub) => {
                                        const isSubActive = pathname === sub.href
                                        return (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className={`sidebar-sublink ${isSubActive ? 'active' : ''}`}
                                            >
                                                <sub.icon className="sidebar-sublink-icon" />
                                                {sub.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-version">v3.0.0</div>
                <button onClick={handleSignOut} className="sidebar-logout">
                    <LogOut className="sidebar-logout-icon" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
