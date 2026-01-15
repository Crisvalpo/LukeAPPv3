'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCompanyById, updateCompany, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, Check, X } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Icons } from '@/components/ui/Icons'
import { InputField } from '@/components/ui/InputField'
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

    useEffect(() => {
        loadCompanyData()
    }, [])

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

        // Load stats
        const companyStats = await getCompanyStats(memberData.company_id)
        setStats(companyStats)

        setIsLoading(false)
    }

    async function handleSave() {
        if (!company) return

        setIsSaving(true)
        setError('')

        const result = await updateCompany(company.id, {
            name: editedName
        })

        if (result.success && result.data) {
            setCompany(result.data)
            setIsEditing(false)
        } else {
            setError(result.message)
        }

        setIsSaving(false)
    }

    function handleCancel() {
        if (company) {
            setEditedName(company.name)
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
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">Mi Empresa</Heading>
                </div>
                <Text size="base" className="dashboard-subtitle">
                    Información detalla y configuración de tu organización
                </Text>
            </div>

            <div className="company-profile-container">
                {/* Main Profile Card */}
                <div className="profile-header-card">
                    <div className="profile-header-glow" />

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <div className="company-main-info">
                        <div className="company-logo-box">
                            <Building2 className="company-logo-icon" />
                        </div>

                        <div className="company-content">
                            {isEditing ? (
                                <div className="company-name-row">
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="edit-input"
                                        placeholder="Nombre de la empresa"
                                        autoFocus
                                    />
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
                                <div className="company-name-row">
                                    <Heading as="h2" className="company-name">{company.name}</Heading>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="icon-btn edit"
                                        title="Editar nombre"
                                    >
                                        <Icons.Edit size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="company-meta-row">
                                <span className="company-date">
                                    Creada el {new Date(company.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Proyectos Activos</span>
                            <span className="stat-value">{stats.projects}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Miembros del Equipo</span>
                            <span className="stat-value">{stats.members}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div>
                    <Heading level={3} size="xl" className="mb-6 text-white font-bold">
                        Accesos Directos
                    </Heading>
                    <div className="quick-actions-grid">
                        <button onClick={() => router.push('/founder/projects')} className="action-card">
                            <div className="action-icon-circle purple-glow">
                                <FolderKanban size={28} />
                            </div>
                            <div className="action-content">
                                <Heading level={4} size="lg">Gestionar Proyectos</Heading>
                                <Text size="sm" variant="muted">Crea, edita y supervisa tus proyectos</Text>
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/invitations')} className="action-card">
                            <div className="action-icon-circle emerald-glow">
                                <Users size={28} />
                            </div>
                            <div className="action-content">
                                <Heading level={4} size="lg">Invitar Equipo</Heading>
                                <Text size="sm" variant="muted">Agrega administradores y colaboradores</Text>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
