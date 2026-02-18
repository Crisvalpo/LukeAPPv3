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
    Palette,
    Menu,
    X,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { getOnboardingStatus } from '@/actions/onboarding'
// Styles migrated to Tailwind v4
import OnboardingWidget from '@/components/onboarding/OnboardingWidget'

interface SidebarProps {
    role: 'super_admin' | 'founder' | 'admin' | string
    companyName?: string | null
    companyId?: string | null
    companyLogoUrl?: string | null
    planTier?: string | null
    userEmail?: string | null
    functionalRoleName?: string | null
}

type MenuItem = {
    name: string
    href: string
    icon: any
    subitems?: { name: string; href: string; icon: any }[]
}

export default function Sidebar({ role, companyName, companyId, companyLogoUrl, planTier, userEmail, functionalRoleName }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
    const [isOpen, setIsOpen] = useState(false) // Mobile drawer state
    const [isCollapsed, setIsCollapsed] = useState(false) // Desktop collapse state
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(true) // Default to true to avoid flash

    // Fetch onboarding status for Founders
    React.useEffect(() => {
        if (role === 'founder' && companyId) {
            const checkOnboarding = async () => {
                const status = await getOnboardingStatus(companyId)
                setIsOnboardingComplete(status.isComplete)
            }
            checkOnboarding()

            // Listen for onboarding updates
            window.addEventListener('onboarding-updated', checkOnboarding)
            return () => window.removeEventListener('onboarding-updated', checkOnboarding)
        }
    }, [role, companyId])

    // Synchronize --sidebar-width variable
    React.useEffect(() => {
        const updateWidth = () => {
            const width = isCollapsed ? '5rem' : '16rem'
            document.documentElement.style.setProperty('--sidebar-width', width)
        }
        updateWidth()
    }, [isCollapsed])

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const toggleSubitem = (name: string) => {
        setOpenItems(prev => ({ ...prev, [name]: !prev[name] }))
    }

    const toggleDesktopCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    // Staff Menu (Super Admin Global)
    const staffMenu: MenuItem[] = [
        { name: 'Vista General', href: '/staff', icon: LayoutDashboard },
        { name: 'Empresas', href: '/staff/companies', icon: Building2 },
        { name: 'Planes', href: '/staff/plans', icon: Tag },
        { name: 'Pagos', href: '/staff/payments', icon: CreditCard },
        { name: 'Style Guide', href: '/staff/styleguide', icon: Palette },
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
        { name: 'Proyectos', href: '/admin/projects', icon: FolderKanban },
    ]

    const menuItems = role === 'super_admin' ? staffMenu : (role === 'founder' ? founderMenu : adminMenu)

    return (
        <>
            {/* Hamburger Button (Mobile Only) - Now more subtle as a top-left trigger */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="md:hidden fixed top-4 left-4 z-[100] p-2 bg-brand-primary text-white rounded-lg active:scale-95 transition-transform"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Mobile Overlay (Dark and Opaque) */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/90 z-[80]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen transition-all duration-300 z-[95]
                border-r border-white/5 flex flex-col shadow-2xl
                ${isOpen ? 'translate-x-0 w-full md:w-64' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                bg-[#0f172a] md:bg-[#0f172a]/80 md:backdrop-blur-3xl
            `}
            >
                {/* Header */}
                {/* Header Section */}
                <div className={`
                    flex flex-col border-b border-white/5 bg-black/20 transition-all duration-300
                    ${isCollapsed ? 'md:items-center py-4' : 'p-4'}
                `}>
                    {/* Top Row: Mobile Close Button */}
                    <div className="flex md:hidden items-center justify-end mb-3">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Middle Row: Logo/Name + Badges */}
                    <div className={`flex gap-3 ${isCollapsed ? 'flex-col items-center' : 'items-start justify-between'}`}>
                        <div className="flex flex-col min-w-0">
                            {!isCollapsed ? (
                                <>
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                                        LukeAPP
                                    </span>
                                    {companyName && role !== 'super_admin' && (
                                        <span className="text-[10px] text-slate-400 font-medium leading-tight truncate max-w-[120px]">
                                            {companyName}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-center w-full">
                                    {companyLogoUrl ? (
                                        <div className="relative w-10 h-10 rounded-full border-2 border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden bg-white">
                                            <img
                                                src={companyLogoUrl}
                                                alt="Logo"
                                                className="w-full h-full object-contain p-1"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent w-full text-center">
                                            L
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Badges Column (Next to name in expanded mode) */}
                        {!isCollapsed && (
                            <div className="flex flex-col gap-1 items-end shrink-0 pt-1">
                                <span className={`
                                    text-[8px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold
                                    ${role === 'super_admin'
                                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}
                                `}>
                                    {role === 'super_admin' ? 'STAFF' :
                                        role === 'founder' ? 'FOUNDER' :
                                            functionalRoleName ? functionalRoleName.toUpperCase() : role.toUpperCase()}
                                </span>
                                {planTier && role !== 'super_admin' && (
                                    <span className={`
                                        text-[8px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold
                                        ${planTier === 'pro' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' :
                                            planTier === 'enterprise' ? 'bg-red-500/10 text-red-300 border-red-500/30' :
                                                'bg-slate-500/10 text-slate-300 border-slate-500/20'}
                                    `}>
                                        {planTier.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>


                {/* Onboarding Widget */}
                {!isCollapsed && role === 'founder' && companyId && (
                    <div className="px-4 mb-2">
                        <OnboardingWidget companyId={companyId} />
                    </div>
                )}

                {/* Navigation */}
                <nav className={`
                    flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1
                    scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
                    ${isCollapsed ? 'items-center' : ''}
                `}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        const hasSubitems = item.subitems && item.subitems.length > 0
                        const isSubOpen = openItems[item.name]

                        const isStyleGuide = item.href === '/staff/styleguide'
                        const visibilityClass = isStyleGuide ? 'hidden md:flex' : 'flex'

                        return (
                            <div key={item.name} className="w-full">
                                {/* Main Link */}
                                <Link
                                    href={item.href}
                                    className={`
                                        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20 shadow-[0_10px_15px_-3px_rgba(59,130,246,0.05)]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                                        ${visibilityClass}
                                        ${isCollapsed ? 'justify-center p-2' : ''}
                                        ${(role === 'founder' && !isOnboardingComplete) ? 'opacity-40 grayscale pointer-events-none' : ''}
                                    `}
                                    title={(role === 'founder' && !isOnboardingComplete) ? 'Completa el onboarding para desbloquear' : (isCollapsed ? item.name : '')}
                                    onClick={(e) => {
                                        if (role === 'founder' && !isOnboardingComplete) {
                                            e.preventDefault()
                                            return
                                        }
                                        if (hasSubitems) {
                                            e.preventDefault()
                                            toggleSubitem(item.name)
                                        } else {
                                            setIsOpen(false)
                                        }
                                    }}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-2 bottom-2 w-[4px] bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full shadow-[2px_0_10px_rgba(59,130,246,0.4)]" />
                                    )}
                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'm-0' : ''}`} />
                                    {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                                    {!isCollapsed && hasSubitems && (
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isSubOpen ? 'rotate-90' : ''}`} />
                                    )}
                                </Link>

                                {/* Subitems */}
                                {!isCollapsed && hasSubitems && isSubOpen && (
                                    <div className="mt-1 ml-8 pl-3 flex flex-col gap-1 border-l border-white/5">
                                        {item.subitems!.map((sub) => {
                                            const isSubActive = pathname === sub.href
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                                                        ${isSubActive ? 'text-blue-300 bg-blue-500/5' : 'text-slate-400 hover:text-white hover:bg-white/3'}
                                                    `}
                                                >
                                                    <sub.icon className="w-4 h-4" />
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
                <div className="mt-auto border-t border-white/5 bg-black/10">
                    {/* Desktop Collapse Action - Moved to Footer */}
                    <div className="hidden md:flex flex-col items-center pt-2 px-4">
                        <button
                            onClick={toggleDesktopCollapse}
                            className={`
                                w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all
                                ${!isCollapsed ? 'justify-end px-0 hover:bg-transparent' : ''}
                            `}
                            title={isCollapsed ? "Expandir" : "Contraer"}
                        >
                            <div className={`
                                p-1.5 rounded-md transition-all
                                ${!isCollapsed ? 'hover:bg-white/5' : ''}
                            `}>
                                <ChevronRight className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} size={18} />
                            </div>
                        </button>
                    </div>

                    <div className={`p-4 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg">
                            {userEmail?.[0]?.toUpperCase() || '?'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">{userEmail || 'Usuario'}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter flex items-center gap-1">
                                    {role === 'super_admin' && (
                                        <>
                                            <span className="text-amber-500">⚡</span>
                                            Super Admin
                                        </>
                                    )}
                                    {role === 'founder' && '🏢 Founder'}
                                    {role === 'admin' && '👤 Admin'}
                                </div>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button
                                onClick={handleSignOut}
                                className="w-8 h-8 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center shrink-0"
                                title="Cerrar sesión"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}
