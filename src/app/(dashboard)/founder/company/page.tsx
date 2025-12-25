'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCompanyById, updateCompany, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, Edit2, X, Check } from 'lucide-react'
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
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>No se encontró la empresa</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">

            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="dashboard-header-content">
                        <div className="dashboard-accent-line" />
                        <h1 className="dashboard-title">Mi Empresa</h1>
                    </div>
                </div>
                <p className="dashboard-subtitle">Información y configuración de tu empresa</p>
            </div>

            <div className="company-profile-container">
                {/* Main Profile Card */}
                <div className="profile-header-card">
                    <div className="profile-header-glow" />

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#f87171',
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 2
                        }}>
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
                                    <h2 className="company-name">{company.name}</h2>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="icon-btn"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                                        title="Editar nombre"
                                    >
                                        <Edit2 size={18} />
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>
                        Accesos Directos
                    </h3>
                    <div className="quick-actions-grid">
                        <button onClick={() => router.push('/founder/projects')} className="action-card">
                            <div className="action-icon-circle purple-glow">
                                <FolderKanban size={28} />
                            </div>
                            <div className="action-content">
                                <h3>Gestionar Proyectos</h3>
                                <p>Crea, edita y supervisa tus proyectos</p>
                            </div>
                        </button>

                        <button onClick={() => router.push('/founder/invitations')} className="action-card">
                            <div className="action-icon-circle emerald-glow">
                                <Users size={28} />
                            </div>
                            <div className="action-content">
                                <h3>Invitar Equipo</h3>
                                <p>Agrega administradores y colaboradores</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
