/**
 * Revisions Dashboard Page
 * 
 * Lists all engineering revisions for a project with filtering and status overview.
 * Accessible to Founder/Admin roles.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchProjectRevisions } from '@/actions/revisions'
import type { EngineeringRevision } from '@/types'
import { REVISION_STATUS_LABELS } from '@/constants'
import { ClipboardList, Hourglass, CheckCircle2, FileText, Inbox } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/revisions.css'

export default function RevisionsPage() {
    const router = useRouter()
    const [revisions, setRevisions] = useState<EngineeringRevision[]>([])
    const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string }>>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [projectId, setProjectId] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        loadRevisions()
    }, [])

    async function loadRevisions() {
        setIsLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // Get user (Founder context)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            // Get Founder's company
            const { data: memberData } = await supabase
                .from('members')
                .select('company_id')
                .eq('user_id', user.id)
                .eq('role_id', 'founder')
                .limit(1)
                .single()

            if (!memberData?.company_id) {
                setError('No tienes una empresa asignada')
                setIsLoading(false)
                return
            }

            // Get all projects for this company
            const { data: companyProjects, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, code')
                .eq('company_id', memberData.company_id)
                .order('name')

            if (projectsError) {
                setError('Error al cargar proyectos')
                setIsLoading(false)
                return
            }

            if (!companyProjects || companyProjects.length === 0) {
                setError('No hay proyectos en tu empresa')
                setIsLoading(false)
                return
            }

            setProjects(companyProjects)

            // If no project selected yet, select the first one
            if (!projectId && companyProjects.length > 0) {
                setProjectId(companyProjects[0].id)
                return // Will trigger useEffect to load revisions
            }

            // Load revisions for selected project
            if (projectId) {
                const result = await fetchProjectRevisions(projectId)

                if (result.success) {
                    setRevisions(result.data || [])
                } else {
                    setError(result.message ?? 'Error desconocido')
                }
            }

        } catch (err) {
            console.error('Error loading revisions:', err)
            setError('Error al cargar revisiones')
        } finally {
            setIsLoading(false)
        }
    }

    // Reload revisions when project changes
    useEffect(() => {
        if (projectId && projects.length > 0) {
            loadRevisions()
        }
    }, [projectId])

    const filteredRevisions = statusFilter === 'ALL'
        ? revisions
        : revisions.filter(r => r.revision_status === statusFilter)

    // Calculate stats
    const stats = {
        total: revisions.length,
        pending: revisions.filter(r => r.revision_status === 'PENDING').length,
        approved: revisions.filter(r => r.revision_status === 'APPROVED').length,
        applied: revisions.filter(r => r.revision_status === 'APPLIED').length,
        draft: revisions.filter(r => r.revision_status === 'DRAFT').length
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#f87171'
                }}>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>Revisiones de Ingeniería</h1>
                    <p className="dashboard-subtitle">
                        Control de cambios y gestión de impactos
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="revisions-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Revisiones</div>
                    </div>
                </div>

                <div className="stat-card stat-warning">
                    <div className="stat-icon">
                        <Hourglass size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>

                <div className="stat-card stat-success">
                    <div className="stat-icon">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.applied}</div>
                        <div className="stat-label">Aplicadas</div>
                    </div>
                </div>

                <div className="stat-card stat-info">
                    <div className="stat-icon">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.draft}</div>
                        <div className="stat-label">Borradores</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="revisions-filters">
                {/* Project Selector */}
                <div className="filter-group">
                    <label className="filter-label">Proyecto:</label>
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="filter-select"
                        style={{ fontWeight: '600' }}
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.code} - {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="filter-group">
                    <label className="filter-label">Estado:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos</option>
                        <option value="DRAFT">Borradores</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="APPROVED">Aprobadas</option>
                        <option value="APPLIED">Aplicadas</option>
                        <option value="REJECTED">Rechazadas</option>
                    </select>
                </div>
            </div>

            <div className="revisions-list">
                {filteredRevisions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Inbox size={48} />
                        </div>
                        <h3>No hay revisiones</h3>
                        <p>
                            {statusFilter === 'ALL'
                                ? 'Aún no se han anunciado revisiones de ingeniería'
                                : `No hay revisiones con estado "${REVISION_STATUS_LABELS[statusFilter]?.label}"`
                            }
                        </p>
                    </div>
                ) : (
                    filteredRevisions.map(revision => (
                        <div
                            key={revision.id}
                            className="revision-card"
                            onClick={() => router.push(`/founder/revisions/${revision.id}`)}
                        >
                            <div className="revision-header">
                                <div className="revision-title">
                                    <span className="revision-id">Rev {revision.rev_code}</span>
                                </div>
                                <div
                                    className="revision-status-badge"
                                    style={{
                                        background: `${REVISION_STATUS_LABELS[revision.revision_status]?.color}33`,
                                        color: REVISION_STATUS_LABELS[revision.revision_status]?.color,
                                        border: `1px solid ${REVISION_STATUS_LABELS[revision.revision_status]?.color}66`
                                    }}
                                >
                                    {REVISION_STATUS_LABELS[revision.revision_status]?.label}
                                </div>
                            </div>

                            <div className="revision-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Anunciada:</span>
                                    <span className="meta-value">
                                        {revision.announcement_date
                                            ? new Date(revision.announcement_date).toLocaleDateString('es-CL')
                                            : 'No anunciada'
                                        }
                                    </span>
                                </div>


                            </div>

                            <div className="revision-actions">
                                <button
                                    className="action-button action-primary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/founder/revisions/${revision.id}`)
                                    }}
                                >
                                    Ver Detalles →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
