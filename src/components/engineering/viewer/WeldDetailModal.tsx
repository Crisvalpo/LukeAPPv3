'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface WeldDetailModalProps {
    weld: {
        id: string
        weld_number: string
        type_weld: string | null
        nps: string | null
        sch: string | null
        destination: string | null
        thickness: string | null
        piping_class: string | null
        material: string | null
        spool_number: string
        iso_number: string
    }
    weldTypeConfig?: {
        requires_welder: boolean
        icon: string
        color: string
        type_name_es: string
    }
    onClose: () => void
    onUpdate?: (updatedWeld: any) => void
}

export default function WeldDetailModal({ weld, weldTypeConfig, onClose, onUpdate }: WeldDetailModalProps) {
    const [status, setStatus] = useState((weld as any).execution_status || 'PENDING')
    const [welder, setWelder] = useState((weld as any).welder_stamp || '')
    const [supportWelder, setSupportWelder] = useState((weld as any).support_welder_id || '')
    const [notes, setNotes] = useState((weld as any).execution_notes || '')
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [updatedData, setUpdatedData] = useState<any>(null)
    const [refreshHistoryToken, setRefreshHistoryToken] = useState(0)
    const [currentUserName, setCurrentUserName] = useState<string>('')
    const [missingName, setMissingName] = useState(false)

    const currentWeld = updatedData ? { ...weld, ...updatedData } : weld
    const effectiveStatus = (updatedData ? updatedData.execution_status : (weld as any).execution_status) || 'PENDING'

    // Fetch user details on mount
    useEffect(() => {
        const checkUser = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const fullName = user.user_metadata?.full_name || user.user_metadata?.nombre || ''
                if (fullName) {
                    setCurrentUserName(fullName)
                } else {
                    setMissingName(true)
                }
            }
        }
        checkUser()
    }, [])

    // Read-Only Mode Detection
    const isReadOnly = effectiveStatus === 'EXECUTED'

    // Validation
    const isFormValid = () => {
        // CRITICAL: Block re-execution of already executed welds
        if (isReadOnly && status === 'EXECUTED') return false

        // Pending is not a target status
        if (status === 'PENDING') return false

        // Identity Check
        if (missingName && !currentUserName.trim()) return false

        // Status Specific Checks
        if (status === 'EXECUTED') {
            if (weldTypeConfig?.requires_welder !== false && !welder) return false
        }
        if (status === 'REWORK') {
            if (!notes) return false
        }

        // Transition Checks
        if ((effectiveStatus === 'EXECUTED' || effectiveStatus === 'REWORK') && status === 'PENDING') return false
        if (effectiveStatus === 'REWORK' && status === 'EXECUTED') return false

        return true
    }

    const canSave = isFormValid()

    const handleSave = async () => {
        setSaving(true)
        setSaveSuccess(false)
        try {
            const { updateWeldStatusAction } = await import('@/actions/welds')

            if (missingName && !currentUserName.trim()) {
                alert('Por favor ingresa tu nombre para el registro histórico.')
                setSaving(false)
                return
            }

            if (missingName && currentUserName.trim()) {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                await supabase.auth.updateUser({
                    data: { full_name: currentUserName }
                })
                setMissingName(false)
            }

            if (status === 'EXECUTED' && weldTypeConfig?.requires_welder !== false && !welder) {
                alert('Debes seleccionar un soldador (Raíz)')
                setSaving(false)
                return
            }

            if (status === 'REWORK' && !notes) {
                alert('Debes indicar el motivo del retrabajo')
                setSaving(false)
                return
            }

            if ((effectiveStatus === 'EXECUTED' || effectiveStatus === 'REWORK') && status === 'PENDING') {
                alert('No se puede volver a PENDIENTE una soldadura EJECUTADA o en RETRABAJO.')
                setSaving(false)
                return
            }

            if (effectiveStatus === 'REWORK' && status === 'EXECUTED') {
                alert('No se puede marcar como EJECUTADA una soldadura en RETRABAJO.')
                setSaving(false)
                return
            }

            const now = new Date().toISOString()
            setUpdatedData({
                execution_status: status,
                welder_stamp: welder,
                support_welder_id: supportWelder,
                execution_notes: notes,
                executed_at: now
            })

            const result = await updateWeldStatusAction({
                weldId: weld.id,
                projectId: (weld as any).project_id,
                status: status as any,
                welderStamp: welder,
                supportWelderId: supportWelder || null,
                executionNotes: notes
            })

            if (!result.success) throw new Error(result.error)

            setSaveSuccess(true)
            setRefreshHistoryToken(prev => prev + 1)

            if (onUpdate) {
                onUpdate({
                    ...weld,
                    execution_status: status,
                    welder_stamp: welder,
                    support_welder_id: supportWelder,
                    execution_notes: notes,
                    executed_at: now
                })
            }

            setTimeout(() => setSaveSuccess(false), 3000)

        } catch (error) {
            console.error(error)
            alert('Error al guardar')
            setUpdatedData(null)
        } finally {
            setSaving(false)
        }
    }

    const weldIcon = weldTypeConfig?.icon

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    // Mock Welders
    const MOCK_WELDERS = ['W-01', 'W-02', 'W-03', 'W-04', 'W-05']

    const content = (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{weldIcon}</span>
                        <div>
                            <h2 style={{
                                margin: 0,
                                color: '#e2e8f0',
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                            }}>
                                {currentWeld.weld_number}
                            </h2>
                            {currentWeld.type_weld && (
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '4px',
                                    backgroundColor: weldTypeConfig?.color
                                        ? `${weldTypeConfig.color}20`
                                        : 'rgba(59, 130, 246, 0.15)',
                                    color: weldTypeConfig?.color || '#60a5fa',
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    border: `1px solid ${weldTypeConfig?.color || '#3b82f6'}`
                                }}>
                                    {currentWeld.type_weld}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {/* Execution Form */}
                    <section style={{
                        backgroundColor: '#1a2332',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #2d3b4e',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#94a3b8',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            Registro de Ejecución
                        </h3>

                        {/* Lock Banner */}
                        {isReadOnly && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px 14px',
                                backgroundColor: 'rgba(251,191,36,0.1)',
                                border: '1.5px solid #fbbf24',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '1.3rem' }}>🔒</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.85rem', marginBottom: '2px' }}>Soldadura Completada</div>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Esta unión ya fue registrada como ejecutada. Solo se permiten cambios a <strong>RETRABAJO</strong> o <strong>ELIMINADA</strong>.</div>
                                </div>
                            </div>
                        )}

                        {/* Identity Check */}
                        {missingName && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: 'rgba(251,191,36,0.1)',
                                border: '1px solid #fbbf24',
                                borderRadius: '6px'
                            }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#fbbf24', marginBottom: '8px' }}>⚠️ Tu nombre no está registrado. Por favor ingrésalo para continuar:</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    value={currentUserName}
                                    onChange={(e) => setCurrentUserName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #fbbf24',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        )}

                        {/* Status Actions */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Estado</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {/* EXECUTED Button */}
                                <button
                                    onClick={() => setStatus('EXECUTED')}
                                    disabled={isReadOnly || effectiveStatus === 'REWORK'}
                                    style={{
                                        flex: '1 0 140px',
                                        padding: '12px 16px',
                                        backgroundColor: status === 'EXECUTED' ? '#4ade80' : 'transparent',
                                        color: status === 'EXECUTED' ? '#1e293b' : (isReadOnly ? '#64748b' : '#4ade80'),
                                        border: `2px solid ${status === 'EXECUTED' ? '#4ade80' : '#334155'}`,
                                        borderRadius: '8px',
                                        cursor: (isReadOnly || effectiveStatus === 'REWORK') ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        opacity: (isReadOnly || effectiveStatus === 'REWORK') ? 0.3 : 1
                                    }}
                                >
                                    EJECUTADA
                                </button>

                                {/* REWORK & DELETED Buttons */}
                                {[
                                    { id: 'REWORK', label: 'RETRABAJO', color: '#f87171', disabled: effectiveStatus === 'PENDING' },
                                    { id: 'DELETED', label: 'ELIMINADA', color: '#94a3b8' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setStatus(opt.id)}
                                        disabled={opt.disabled}
                                        style={{
                                            flex: '1 0 140px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `2px solid ${status === opt.id ? opt.color : '#334155'}`,
                                            backgroundColor: status === opt.id ? opt.color : 'transparent',
                                            color: status === opt.id ? '#1e293b' : (opt.disabled ? '#64748b' : opt.color),
                                            cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            opacity: opt.disabled ? 0.3 : 1
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Welder Selection */}
                        {status === 'EXECUTED' && (weldTypeConfig?.requires_welder !== false) && (
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Soldador *</label>
                                    <select
                                        value={welder}
                                        onChange={(e) => {
                                            setWelder(e.target.value)
                                            if (supportWelder === e.target.value) setSupportWelder('')
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {MOCK_WELDERS.map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Apoyo</label>
                                    <select
                                        value={supportWelder}
                                        onChange={(e) => setSupportWelder(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">Ninguno</option>
                                        {MOCK_WELDERS.filter(w => w !== welder).map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Rework Reason */}
                        {status === 'REWORK' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Motivo de Retrabajo *</label>
                                <select
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#f87171',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="">Seleccionar Motivo...</option>
                                    <option value="ERROR_CONTRATISTA">Error Contratista (Ejecución)</option>
                                    <option value="ERROR_INGENIERIA">Error Ingeniería (Interferencia/Diseño)</option>
                                </select>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving || (!canSave && !saveSuccess)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: saveSuccess ? '#10b981' : ((saving || !canSave) ? '#334155' : '#3b82f6'),
                                color: (saving || !canSave) && !saveSuccess ? '#94a3b8' : 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: (saving || (!canSave && !saveSuccess)) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: (saving || !canSave) && !saveSuccess ? 0.6 : 1,
                                fontSize: '0.9rem'
                            }}
                        >
                            {saving ? 'Guardando...' : (saveSuccess ? '✅ ¡Guardado Exitosamente!' : '💾 Guardar Cambios')}
                        </button>
                    </section>

                    {/* Basic Information */}
                    <section style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            color: '#cbd5e1',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '12px'
                        }}>
                            Información Básica
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                        }}>
                            <InfoField label="Diámetro (NPS)" value={currentWeld.nps ? (currentWeld.nps.endsWith('"') ? currentWeld.nps : `${currentWeld.nps}"`) : '-'} />
                            <InfoField label="Schedule" value={currentWeld.sch || '-'} />
                            <InfoField
                                label="Destino"
                                value={currentWeld.destination?.toUpperCase() === 'F' || currentWeld.destination?.toUpperCase() === 'FIELD' ? 'FIELD' : 'SHOP'}
                                highlight={currentWeld.destination?.toUpperCase() === 'F' ? '#f97316' : '#3b82f6'}
                            />
                            <InfoField label="Spool" value={currentWeld.spool_number} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <InfoField label="Isométrico" value={currentWeld.iso_number} fullWidth />
                        </div>
                    </section>

                    {/* History Section */}
                    <section>
                        <WeldHistoryList weldId={weld.id} triggerRefresh={refreshHistoryToken} />
                    </section>
                </div>
            </div>
        </div>
    )

    return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}

// Helper Components
function InfoField({ label, value, highlight, fullWidth }: {
    label: string
    value: string
    highlight?: string
    fullWidth?: boolean
}) {
    return (
        <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
            <div style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '4px',
                fontWeight: '500'
            }}>
                {label}
            </div>
            <div style={{
                fontSize: '0.95rem',
                color: highlight || '#e2e8f0',
                fontWeight: highlight ? '600' : '400',
                padding: '8px 12px',
                backgroundColor: '#0f172a',
                borderRadius: '6px',
                border: '1px solid #1e293b'
            }}>
                {value}
            </div>
        </div>
    )
}

function WeldHistoryList({ weldId, triggerRefresh }: { weldId: string, triggerRefresh?: any }) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function fetchHistory() {
            setLoading(true)
            try {
                const { getWeldHistoryAction } = await import('@/actions/welds')
                const res = await getWeldHistoryAction(weldId)
                if (mounted && res.success) {
                    setHistory(res.data || [])
                }
            } catch (error) {
                console.error('Failed to load history', error)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchHistory()
        return () => { mounted = false }
    }, [weldId, triggerRefresh])

    if (loading && history.length === 0) return <div style={{ padding: '10px', color: '#64748b', fontSize: '0.8rem' }}>Cargando historial...</div>

    // Empty state
    if (history.length === 0) {
        return (
            <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase' }}>Reportes Asociados</h4>
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px dashed #334155' }}>
                    Sin cambios registrados aún
                </div>
            </div>
        )
    }

    return (
        <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase' }}>Reportes Asociados</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((record) => {
                    const welderMatch = record.comments?.match(/Soldador:\s*([A-Z0-9-]+)/i)
                    const welderStamp = welderMatch ? welderMatch[1] : null

                    return (
                        <div key={record.id} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                            <div style={{ color: '#64748b', minWidth: '120px' }}>
                                {new Date(record.changed_at).toLocaleString('es-CL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '4px' }}>
                                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                                        {record.user?.raw_user_meta_data?.full_name || record.user?.email || 'Usuario'}
                                    </span>
                                    <span style={{ margin: '0 6px', color: '#475569' }}>→</span>
                                    <span style={{
                                        color: record.new_status === 'EXECUTED' ? '#4ade80' :
                                            record.new_status === 'REWORK' ? '#f87171' :
                                                record.new_status === 'PENDING' ? '#fbbf24' :
                                                    record.new_status === 'DELETED' ? '#94a3b8' : '#cbd5e1',
                                        fontWeight: 'bold'
                                    }}>
                                        {record.new_status}
                                    </span>
                                    {welderStamp && (
                                        <span style={{ marginLeft: '8px', color: '#60a5fa', fontSize: '0.8rem' }}>
                                            👷 {welderStamp}
                                        </span>
                                    )}
                                </div>
                                {record.comments && !welderMatch && (
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        color: '#e2e8f0',
                                        fontStyle: 'italic',
                                        borderLeft: '2px solid #475569'
                                    }}>
                                        "{record.comments}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
