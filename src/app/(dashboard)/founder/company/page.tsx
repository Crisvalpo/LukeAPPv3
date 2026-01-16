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
import '@/styles/dashboard.css'
import '@/styles/companies.css'
import '@/styles/company-profile.css'

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
            {/* ... Header ... */}

            <div className="company-profile-container">
                {/* Main Profile Card */}
                <div className="profile-header-card">
                    {/* ... error banner ... */}

                    {/* Profile Header Flex Container */}
                    <div className="profile-header-flex">
                        {/* Company Info (Left) */}
                        <div className="company-content">
                            {isEditing ? (
                                <div className="company-edit-form">
                                    <div className="form-group">
                                        <label className="input-label">Nombre de la Empresa</label>
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="edit-input"
                                            placeholder="Nombre de la empresa"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">RUT / Tax ID <span className="required-star">*</span></label>
                                        <input
                                            type="text"
                                            value={editedRut}
                                            onChange={(e) => setEditedRut(e.target.value)}
                                            className="edit-input"
                                            placeholder="Ej: 76.123.456-K"
                                        />
                                    </div>
                                    <div className="edit-actions">
                                        <button onClick={handleSave} disabled={isSaving || !editedName.trim()} className="icon-btn save" title="Guardar">
                                            <Check size={20} />
                                        </button>
                                        <button onClick={handleCancel} disabled={isSaving} className="icon-btn cancel" title="Cancelar">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="company-display-info">
                                    <div className="company-name-row">
                                        <Heading as="h2" className="company-name">{company.name}</Heading>

                                        {/* RUT Display with Badge if missing */}
                                        {(company as any).rut ? (
                                            <Text size="base" variant="muted" style={{ fontFamily: 'monospace', marginLeft: '1rem' }}>
                                                RUT: {(company as any).rut}
                                            </Text>
                                        ) : (
                                            <span
                                                className="missing-badge pulsate"
                                                onClick={() => setIsEditing(true)}
                                                style={{ cursor: 'pointer', marginLeft: '1rem' }}
                                                title="Haz clic para agregar"
                                            >
                                                ⚠️ Falta RUT
                                            </span>
                                        )}

                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="icon-btn edit"
                                            title="Editar información"
                                            style={{ marginLeft: '0.5rem' }}
                                        >
                                            <Icons.Edit size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="company-meta-row">
                                <span className="company-date">
                                    📅 Creada el {new Date(company.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="company-badge">
                                    ✨ Activa
                                </span>
                            </div>
                        </div>

                        {/* Logo Section (Right) */}
                        <div className="company-logo-section">
                            <div className="logo-wrapper">
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
                    </div>

                    {/* Stats Grid - Enhanced */}
                    <div className="profile-stats-grid">
                        <div className="stat-card">
                            <div className="stat-card-header">
                                <div className="stat-icon">
                                    <FolderKanban size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Proyectos Activos</div>
                            <div className="stat-value">{stats.projects}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-header">
                                <div className="stat-icon">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Miembros del Equipo</div>
                            <div className="stat-value">{stats.members}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div>
                    <Heading level={3} size="xl" style={{ marginBottom: '1.5rem', color: 'white', fontWeight: 'bold' }}>
                        Accesos Directos
                    </Heading>
                    <div className="quick-actions-grid">
                        <button onClick={() => router.push('/founder/projects')} className="action-card">
                            <div className="action-icon-circle purple-glow">
                                <FolderKanban size={32} />
                            </div>
                            <div className="action-content">
                                <h4>Gestionar Proyectos</h4>
                                <p>Crea, edita y supervisa tus proyectos</p>
                                {stats.projects === 0 && (
                                    <span className="action-badge">Sin proyectos</span>
                                )}
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/settings/invitations')} className="action-card">
                            <div className="action-icon-circle emerald-glow">
                                <Users size={32} />
                            </div>
                            <div className="action-content">
                                <h4>Invitar Equipo</h4>
                                <p>Agrega administradores y colaboradores</p>
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/settings/roles')} className="action-card">
                            <div className="action-icon-circle amber-glow">
                                <Building2 size={32} />
                            </div>
                            <div className="action-content">
                                <h4>Roles y Permisos</h4>
                                <p>Configura roles funcionales de tu equipo</p>
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
