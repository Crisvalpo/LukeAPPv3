'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOnboardingStatus, type OnboardingStatus } from '@/actions/onboarding'
import { getCompanyById, updateCompany, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, Check, X } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Icons } from '@/components/ui/Icons'
import { InputField } from '@/components/ui/InputField'
import CompanyLogoUpload from '@/components/company/CompanyLogoUpload'
import Confetti from '@/components/onboarding/Confetti'
import Toast from '@/components/onboarding/Toast'
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages'
// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4

interface CompanyStats {
    projects: number
    members: number
}

export default function FounderCompanyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    const [company, setCompany] = useState<Company | null>(null)
    const [stats, setStats] = useState<CompanyStats>({ projects: 0, members: 0 })
    const [editedName, setEditedName] = useState('')
    const [editedRut, setEditedRut] = useState('')

    // Celebration state
    const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    useEffect(() => {
        loadCompanyData()
    }, [])

    async function checkCompletion(companyId: string) {
        const status = await getOnboardingStatus(companyId)
        setOnboardingStatus(status)

        // Check if company step is now complete (it wasn't before)
        // Note: We check specifically if the company step is complete in the new status
        if (status.completedSteps.includes('company')) {
            // We can allow re-triggering celebration or check against previous state if we had it fine-grained
            // For now, let's just trigger toast if it looks complete
            if (!onboardingStatus?.completedSteps.includes('company')) {
                setToastMessage(CELEBRATION_MESSAGES.company)
                setShowConfetti(true)

                // Notify other components (like OnboardingWidget) that status has changed
                window.dispatchEvent(new Event('onboarding-updated'))
                router.refresh()

                setTimeout(() => setShowConfetti(false), 5000)
            }
        }
    }

    async function loadCompanyData() {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        // Get founder's company
        const { data: memberData } = await supabase
            .from('members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('role_id', 'founder')
            .single()

        if (!memberData) {
            router.push('/')
            return
        }

        // Load company
        const companyData = await getCompanyById(memberData.company_id)
        if (!companyData) {
            router.push('/')
            return
        }

        setCompany(companyData)
        setEditedName(companyData.name)
        setEditedRut((companyData as any).rut || '')

        // Load stats
        const companyStats = await getCompanyStats(memberData.company_id)
        setStats(companyStats)

        // Load onboarding status
        const status = await getOnboardingStatus(memberData.company_id)
        setOnboardingStatus(status)

        setIsLoading(false)
    }

    async function handleSave() {
        if (!company) return

        setIsSaving(true)
        setError('')

        const result = await updateCompany(company.id, {
            name: editedName,
            rut: editedRut
        })

        if (result.success && result.data) {
            setCompany(result.data)
            setIsEditing(false)
            // Check if this update completed the onboarding step
            checkCompletion(company.id)
        } else {
            setError(result.message)
        }

        setIsSaving(false)
    }

    function handleCancel() {
        if (company) {
            setEditedName(company.name)
            setEditedRut((company as any).rut || '')
        }
        setIsEditing(false)
        setError('')
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <Text size="base" style={{ textAlign: 'center' }}>Cargando perfil...</Text>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="dashboard-page">
                <Text size="base" style={{ textAlign: 'center' }}>No se encontró la empresa</Text>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in px-4 md:px-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="tracking-tight text-white">Perfil de Empresa</Heading>
                    </div>
                    <Text size="base" className="text-slate-400 ml-4.5">Gestiona la identidad y configuración global de tu organización</Text>
                </div>
            </div>

            <div className="flex flex-col gap-10 max-w-7xl mx-auto pt-8">
                {/* Main Profile Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
                    {/* Profile Header Flex Container */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                        {/* Company Info (Left) */}
                        <div className="flex-1 w-full">
                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Nombre de la Empresa</label>
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="Nombre de la empresa"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">RUT / Tax ID <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={editedRut}
                                            onChange={(e) => setEditedRut(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="Ej: 76.123.456-K"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSave} disabled={isSaving || !editedName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl p-3 transition-colors shrink-0" title="Guardar">
                                            <Check size={20} />
                                        </button>
                                        <button onClick={handleCancel} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 transition-colors shrink-0" title="Cancelar">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <Heading level={2}>{company.name}</Heading>

                                        {/* RUT Display with Badge if missing */}
                                        {(company as any).rut ? (
                                            <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                                                <Text variant="muted" className="font-mono text-lg uppercase">
                                                    RUT: {(company as any).rut}
                                                </Text>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="text-slate-500 hover:text-white transition-colors"
                                                    title="Editar información"
                                                >
                                                    <Icons.Edit size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold animate-pulse"
                                            >
                                                ⚠️ Falta RUT
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-6 items-center flex-wrap pt-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 rounded-lg text-sm text-slate-400">
                                            <span>📅 Creada el {new Date(company.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg text-sm text-indigo-400 border border-indigo-500/20">
                                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                            <span>Activa</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logo Section (Right) */}
                        <div className="self-center md:self-start">
                            <CompanyLogoUpload
                                companyId={company.id}
                                companyName={company.name}
                                currentLogoUrl={(company as any).logo_url || null}
                                onUpdate={(newLogoUrl) => {
                                    setCompany({ ...company, logo_url: newLogoUrl } as any);
                                    checkCompletion(company.id);
                                }}
                                showMissingBadge={!(company as any).logo_url}
                            />
                        </div>
                    </div>

                    {/* Stats Grid - Enhanced */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-top border-white/10 pt-10">
                        <div className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl group hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-transform group-hover:scale-110">
                                    <FolderKanban size={28} />
                                </div>
                                <div className="space-y-1">
                                    <div className="uppercase tracking-widest text-xs font-bold text-slate-500">Proyectos Activos</div>
                                    <div className="text-4xl font-bold text-white">{stats.projects}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl group hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-transform group-hover:scale-110">
                                    <Users size={28} />
                                </div>
                                <div className="space-y-1">
                                    <div className="uppercase tracking-widest text-xs font-bold text-slate-500">Miembros del Equipo</div>
                                    <div className="text-4xl font-bold text-white">{stats.members}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="space-y-6">
                    <Heading level={2} className="text-2xl font-bold text-white">Accesos Directos</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button onClick={() => router.push('/founder/projects')} className="flex items-center gap-5 p-6 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-2xl transition-all group text-left">
                            <div className="w-14 h-14 bg-purple-500/15 rounded-xl flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform shrink-0">
                                <FolderKanban size={30} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-semibold text-white">Gestionar Proyectos</h4>
                                <p className="text-sm text-slate-400">Crea, edita y supervisa tus proyectos</p>
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/settings/invitations')} className="flex items-center gap-5 p-6 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-2xl transition-all group text-left">
                            <div className="w-14 h-14 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform shrink-0">
                                <Users size={30} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-semibold text-white">Invitar Equipo</h4>
                                <p className="text-sm text-slate-400">Agrega administradores y colaboradores</p>
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/settings/roles')} className="flex items-center gap-5 p-6 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-2xl transition-all group text-left">
                            <div className="w-14 h-14 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)] group-hover:scale-110 transition-transform shrink-0">
                                <Building2 size={30} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-semibold text-white">Roles y Permisos</h4>
                                <p className="text-sm text-slate-400">Configura roles funcionales de tu equipo</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Celebration Components */}
            <Confetti show={showConfetti} />
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setToastMessage(null)}
                />
            )}
        </div>
    )
}
