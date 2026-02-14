/**
 * Revision Detail Page - "War Room"
 * 
 * Shows detailed impact analysis for a specific revision.
 * Allows strategic resolution of impacts.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchRevisionEvents, fetchRevisionImpacts, resolveImpactAction } from '@/actions/revisions'
import type { EngineeringRevision, RevisionImpact, RevisionEvent } from '@/types'
import { REVISION_STATUS_LABELS, IMPACT_SEVERITY_LABELS, RESOLUTION_TYPE_LABELS } from '@/constants'
import {
    ArrowLeft,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Sparkles
} from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

export default function RevisionDetailPage() {
    const router = useRouter()
    const params = useParams()
    const revisionId = params?.id as string

    const [revision, setRevision] = useState<EngineeringRevision | null>(null)
    const [impacts, setImpacts] = useState<RevisionImpact[]>([])
    const [events, setEvents] = useState<RevisionEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // Resolution modal state
    const [selectedImpact, setSelectedImpact] = useState<RevisionImpact | null>(null)
    const [resolutionType, setResolutionType] = useState('')
    const [resolutionNotes, setResolutionNotes] = useState('')
    const [isResolving, setIsResolving] = useState(false)

    useEffect(() => {
        if (revisionId) {
            loadRevisionDetail()
        }
    }, [revisionId])

    async function loadRevisionDetail() {
        setIsLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // Get user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            // Get revision
            const { data: revData } = await supabase
                .from('engineering_revisions')
                .select('*')
                .eq('id', revisionId)
                .single()

            if (!revData) {
                setError('Revisión no encontrada')
                setIsLoading(false)
                return
            }

            setRevision(revData)

            // Get impacts
            const impactsResult = await fetchRevisionImpacts(revisionId)
            if (impactsResult.success) {
                setImpacts(impactsResult.data || [])
            }

            // Get events
            const eventsResult = await fetchRevisionEvents(revisionId)
            if (eventsResult.success) {
                setEvents(eventsResult.data || [])
            }

        } catch (err) {
            console.error('Error loading revision:', err)
            setError('Error al cargar revisión')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResolveImpact() {
        if (!selectedImpact || !resolutionType) return

        setIsResolving(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const result = await resolveImpactAction(
                selectedImpact.id,
                resolutionType,
                resolutionNotes,
                user.id
            )

            if (result.success) {
                // Reload impacts
                await loadRevisionDetail()
                // Close modal
                setSelectedImpact(null)
                setResolutionType('')
                setResolutionNotes('')
            } else {
                alert(result.message)
            }

        } catch (err) {
            console.error('Error resolving impact:', err)
            alert('Error al resolver impacto')
        } finally {
            setIsResolving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    if (error || !revision) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error || 'Revisión no encontrada'}
                </div>
            </div>
        )
    }

    const unresolvedImpacts = impacts.filter(i => !i.resolved_at)
    const resolvedImpacts = impacts.filter(i => i.resolved_at)

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="tracking-tight text-white">
                            Revisión {revision.rev_code}
                        </Heading>
                        <div
                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{
                                background: `${REVISION_STATUS_LABELS[revision.revision_status]?.color}33`,
                                color: REVISION_STATUS_LABELS[revision.revision_status]?.color,
                                border: `1px solid ${REVISION_STATUS_LABELS[revision.revision_status]?.color}66`
                            }}
                        >
                            {REVISION_STATUS_LABELS[revision.revision_status]?.label}
                        </div>
                    </div>
                </div>
                <Text size="base" className="text-text-muted font-medium ml-14">
                    Análisis de Impactos y Resolución Estratégica
                </Text>
            </div>

            {/* Summary Stats */}
            <div className="revisions-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{impacts.length}</div>
                        <div className="stat-label">Total Impactos</div>
                    </div>
                </div>

                <div className="stat-card stat-warning">
                    <div className="stat-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{unresolvedImpacts.length}</div>
                        <div className="stat-label">Sin Resolver</div>
                    </div>
                </div>

                <div className="stat-card stat-success">
                    <div className="stat-icon">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{resolvedImpacts.length}</div>
                        <div className="stat-label">Resueltos</div>
                    </div>
                </div>

                <div className="stat-card stat-info">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="stat-value">
                            {revision.announcement_date
                                ? new Date(revision.announcement_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                                : 'N/A'
                            }
                        </div>
                        <div className="stat-label">Anunciada</div>
                    </div>
                </div>
            </div>

            {/* No Impacts State */}
            {impacts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Sparkles size={48} />
                    </div>
                    <Heading level={3}>Sin Impactos Detectados</Heading>
                    <p>Esta revisión no generó impactos en la producción existente</p>
                    <p style={{ marginTop: '0.5rem', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} /> Puede aplicarse automáticamente
                    </p>
                </div>
            )}

            {/* Impacts List */}
            {unresolvedImpacts.length > 0 && (
                <>
                    <Heading level={2} className="mb-4">Impactos Pendientes</Heading>
                    <div className="impacts-grid">
                        {unresolvedImpacts.map(impact => (
                            <div
                                key={impact.id}
                                className={`impact-card severity-${impact.severity.toLowerCase()}`}
                            >
                                <div className="impact-header">
                                    <div>
                                        <Heading level={3} size="base" className="mb-2">
                                            Impacto en {impact.affected_entity_type}
                                        </Heading>
                                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                            ID: {impact.affected_entity_id.slice(0, 8)}...
                                        </p>
                                    </div>
                                    <div
                                        className="impact-severity-badge"
                                        style={{
                                            background: `${IMPACT_SEVERITY_LABELS[impact.severity]?.color}33`,
                                            color: IMPACT_SEVERITY_LABELS[impact.severity]?.color,
                                            border: `1px solid ${IMPACT_SEVERITY_LABELS[impact.severity]?.color}66`
                                        }}
                                    >
                                        {IMPACT_SEVERITY_LABELS[impact.severity]?.label}
                                    </div>
                                </div>

                                <div className="impact-details">
                                    <div className="impact-detail-row">
                                        <span className="detail-label">Tipo de Impacto:</span>
                                        <span className="detail-value">{impact.impact_type}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedImpact(impact)
                                        setResolutionType('')
                                        setResolutionNotes('')
                                    }}
                                    className="action-button action-primary"
                                    style={{ marginTop: '1rem', width: '100%' }}
                                >
                                    Resolver Impacto
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Resolved Impacts */}
            {resolvedImpacts.length > 0 && (
                <>
                    <Heading level={2} className="mt-8 mb-4 text-[#4ade80]">
                        Impactos Resueltos
                    </Heading>
                    <div className="impacts-grid">
                        {resolvedImpacts.map(impact => (
                            <div key={impact.id} className="impact-card" style={{ opacity: 0.7 }}>
                                <div className="impact-header">
                                    <div>
                                        <Heading level={3} size="base" className="mb-2">
                                            {impact.affected_entity_type}
                                        </Heading>
                                    </div>
                                    <div style={{ color: '#4ade80' }}>
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>

                                <div className="impact-details">
                                    <div className="impact-detail-row">
                                        <span className="detail-label">Resolución:</span>
                                        <span className="detail-value">
                                            {RESOLUTION_TYPE_LABELS[impact.resolution_type || '']}
                                        </span>
                                    </div>
                                    {impact.resolution_notes && (
                                        <div className="impact-detail-row">
                                            <span className="detail-label">Notas:</span>
                                            <span className="detail-value">{impact.resolution_notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Resolution Modal */}
            {
                selectedImpact && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => setSelectedImpact(null)}
                    >
                        <div
                            style={{
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '1rem',
                                padding: '2rem',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Heading level={2} className="mb-6">
                                Resolución Estratégica
                            </Heading>

                            <div className="form-field">
                                <label className="form-label">Tipo de Resolución</label>
                                <select
                                    value={resolutionType}
                                    onChange={(e) => setResolutionType(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="REWORK">Rehacer Trabajo</option>
                                    <option value="MATERIAL_RETURN">Devolver Material</option>
                                    <option value="FREE_JOINT">Unión Gratis (Strategic)</option>
                                    <option value="TECHNICAL_EXCEPTION">Excepción Técnica</option>
                                    <option value="CLIENT_APPROVAL">Aprobación Cliente</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Notas / Justificación</label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="form-input"
                                    rows={4}
                                    placeholder="Describe la decisión estratégica tomada..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={() => setSelectedImpact(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResolveImpact}
                                    disabled={!resolutionType || isResolving}
                                    className="form-button"
                                    style={{ flex: 1 }}
                                >
                                    {isResolving ? 'Resolviendo...' : 'Confirmar Resolución'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
