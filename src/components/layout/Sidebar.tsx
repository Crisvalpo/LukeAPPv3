'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    FolderKanban,
    Users,
    UserPlus,
    Settings,
    LogOut,
    ChevronRight,
    CreditCard,
    Mail,
    Tag,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import '@/styles/sidebar.css'

interface SidebarProps {
    role: 'super_admin' | 'founder' | 'admin' | string
    companyName?: string | null
    planTier?: string | null
    userEmail?: string | null
    functionalRoleName?: string | null
}

type MenuItem = {
    name: string
    href: string
    icon: React.ElementType
    subitems?: { name: string; href: string; icon: React.ElementType }[]
}

export default function Sidebar({ role, companyName, planTier, userEmail, functionalRoleName }: SidebarProps) {
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
        { name: 'Vista General', href: '/staff', icon: LayoutDashboard },
        { name: 'Empresas', href: '/staff/companies', icon: Building2 },
        { name: 'Planes', href: '/staff/plans', icon: Tag },
        { name: 'Pagos', href: '/staff/payments', icon: CreditCard },
    ]

    // Founder Menu (Company-Level)
    const founderMenu: MenuItem[] = [
        { name: 'Configuración', href: '/founder', icon: Settings },
        { name: 'Proyectos', href: '/founder/projects', icon: FolderKanban },
        { name: 'Suscripción', href: '/founder/subscription', icon: CreditCard },
    ]

    // Admin Menu (Project-Level)
    const adminMenu: MenuItem[] = [
        { name: 'Vista General', href: '/admin', icon: LayoutDashboard },
        { name: 'Personal', href: '/admin/workforce', icon: Users },
        { name: 'Configuración', href: '/admin/settings', icon: Settings },
    ]

    const isManagement = ['founder', 'admin'].includes(role)
    const menuItems = role === 'super_admin' ? staffMenu : (role === 'founder' ? founderMenu : adminMenu)

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-brand-container">
                    <span className="sidebar-logo">LukeAPP</span>
                    {companyName && role !== 'super_admin' && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-company-name">{companyName}</span>
                        </div>
                    )}
                </div>
                <div className="sidebar-badges-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span className={`sidebar-badge ${role === 'super_admin' ? 'staff' : 'management'}`}>
                        {role === 'super_admin' ? 'STAFF' :
                            role === 'founder' ? 'FOUNDER' :
                                functionalRoleName ? functionalRoleName.toUpperCase() : role.toUpperCase()}
                    </span>
                    {planTier && role !== 'super_admin' && (
                        <span className={`sidebar-badge plan-tier ${planTier}`}>
                            {planTier.toUpperCase()}
                        </span>
                    )}
                </div>
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

            <div className="sidebar-footer">
                <div className="sidebar-user-info">
                    <div className="sidebar-user-avatar">
                        {userEmail?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="sidebar-user-details">
                        <div className="sidebar-user-email">{userEmail || 'Usuario'}</div>
                        <div className="sidebar-user-role">
                            {role === 'super_admin' && '⚡ Super Admin'}
                            {role === 'founder' && '🏢 Founder'}
                            {role === 'admin' && '👤 Admin'}
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="sidebar-logout" title="Cerrar sesión">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
