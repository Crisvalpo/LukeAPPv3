'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { InputField } from '@/components/ui/InputField'
import { SelectNative } from '@/components/ui/SelectNative'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'
import { updateWeldStatusAction } from '@/actions/welds'

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
    // ----------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // ----------------------------------------------------------------------
    const [status, setStatus] = useState((weld as any).execution_status || 'PENDING')
    const [welder, setWelder] = useState('')
    const [supportWelder, setSupportWelder] = useState('')
    const [notes, setNotes] = useState((weld as any).execution_notes || '')

    // UI State
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [updatedData, setUpdatedData] = useState<any>(null)
    const [refreshHistoryToken, setRefreshHistoryToken] = useState(0)

    // User Identity State
    const [currentUserName, setCurrentUserName] = useState<string>('')
    const [missingName, setMissingName] = useState(false)

    // Portal Mounting State
    const [mounted, setMounted] = useState(false)

    // Computed Values
    const currentWeld = updatedData ? { ...weld, ...updatedData } : weld
    const effectiveStatus = (updatedData ? updatedData.execution_status : (weld as any).execution_status) || 'PENDING'
    const isReadOnly = effectiveStatus === 'EXECUTED' || effectiveStatus === 'DELETED'
    const weldIcon = weldTypeConfig?.icon || '🔥'

    const MOCK_WELDERS = ['W-01', 'W-02', 'W-03', 'W-04', 'W-05']

    // ----------------------------------------------------------------------
    // 2. EFFECTS
    // ----------------------------------------------------------------------

    // Handle Client-Side Mounting
    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    // Check User Identity
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

    // ----------------------------------------------------------------------
    // 3. LOGIC & HANDLERS
    // ----------------------------------------------------------------------

    const isFormValid = () => {
        if (isReadOnly && status === 'EXECUTED') return false
        if (status === 'PENDING') return false
        if (missingName && !currentUserName.trim()) return false

        if (status === 'EXECUTED' || status === 'REWORK') {
            if (weldTypeConfig?.requires_welder !== false && !welder) return false
        }
        if (status === 'REWORK' && !notes) return false
        if (status === 'DELETED' && !notes) return false

        // Logical Transitions
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

            // Update user name if missing
            if (missingName && currentUserName.trim()) {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                await supabase.auth.updateUser({
                    data: { full_name: currentUserName }
                })
                setMissingName(false)
            }

            // Validations
            if (missingName && !currentUserName.trim()) { throw new Error('Nombre requerido') }
            if ((status === 'EXECUTED' || status === 'REWORK') && weldTypeConfig?.requires_welder !== false && !welder) { throw new Error('Soldador requerido') }
            if (status === 'REWORK' && !notes) { throw new Error('Motivo de retrabajo requerido') }
            if (status === 'DELETED' && !notes) { throw new Error('Motivo de eliminación requerido') }

            const now = new Date().toISOString()
            const payload = {
                execution_status: status,
                welder_stamp: welder,
                support_welder_id: supportWelder,
                execution_notes: notes,
                executed_at: now
            }

            setUpdatedData(payload)

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

            if (onUpdate) onUpdate({ ...weld, ...payload })

            // setTimeout(() => setSaveSuccess(false), 3000) // User requested to keep 'Saved' state visible

        } catch (error: any) {
            console.error(error)
            alert(error.message || 'Error al guardar')
            setUpdatedData(null)
        } finally {
            setSaving(false)
        }
    }

    // ----------------------------------------------------------------------
    // 4. RENDERING
    // ----------------------------------------------------------------------

    if (!mounted) return null
    if (typeof window === 'undefined') return null
    const container = document.body
    if (!container) return null

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}>
            <div style={{
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#f8fafc',
                overflow: 'hidden'
            }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1e293b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '2rem' }}>{weldIcon}</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                                    {currentWeld.weld_number}
                                </h2>
                                {/* Current Status Badge */}
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    padding: '4px 10px',
                                    borderRadius: '99px',
                                    backgroundColor: effectiveStatus === 'EXECUTED' ? 'rgba(74, 222, 128, 0.1)' :
                                        (effectiveStatus === 'REWORK' ? 'rgba(16, 185, 129, 0.1)' :
                                            (effectiveStatus === 'DELETED' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(96, 165, 250, 0.1)')),
                                    color: effectiveStatus === 'EXECUTED' ? '#4ade80' :
                                        (effectiveStatus === 'REWORK' ? '#10b981' :
                                            (effectiveStatus === 'DELETED' ? '#94a3b8' : '#60a5fa')),
                                    border: `1px solid ${effectiveStatus === 'EXECUTED' ? '#22c55e' :
                                        (effectiveStatus === 'REWORK' ? '#10b981' :
                                            (effectiveStatus === 'DELETED' ? '#475569' : '#3b82f6'))}`
                                }}>
                                    {{
                                        'PENDING': 'PENDIENTE',
                                        'EXECUTED': 'EJECUTADA',
                                        'REWORK': 'RETRABAJO',
                                        'DELETED': 'ELIMINADA'
                                    }[effectiveStatus as string] || effectiveStatus}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                    {currentWeld.iso_number}
                                </span>
                                {currentWeld.type_weld && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: weldTypeConfig?.color || '#60a5fa',
                                        backgroundColor: `${weldTypeConfig?.color || '#60a5fa'}20`,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        border: `1px solid ${weldTypeConfig?.color || '#60a5fa'}40`
                                    }}>
                                        {currentWeld.type_weld}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '8px'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>

                    {/* Execution Card */}
                    <div style={{
                        backgroundColor: '#1a2234',
                        border: '1px solid #2d3b4e',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#94a3b8', fontWeight: 600 }}>
                            <span>⚡ Registro de Ejecución</span>
                        </div>

                        {/* Lock Warning */}
                        {isReadOnly && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: effectiveStatus === 'DELETED' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(251, 191, 36, 0.1)',
                                border: `1px solid ${effectiveStatus === 'DELETED' ? '#475569' : '#fbbf24'}`,
                                borderRadius: '8px',
                                color: effectiveStatus === 'DELETED' ? '#cbd5e1' : '#fbbf24',
                                marginBottom: '20px',
                                fontSize: '0.9rem'
                            }}>
                                {effectiveStatus === 'DELETED'
                                    ? <span><strong>🔒 Unión Eliminada.</strong> Esta acción es definitiva.</span>
                                    : <span><strong>🔒 Soldadura Completada.</strong> Solo se permiten cambios a RETRABAJO o ELIMINADA.</span>
                                }
                            </div>
                        )}



                        {/* Name Input */}
                        {missingName && (
                            <div style={{ marginBottom: '20px' }}>
                                <InputField
                                    label="⚠️ Ingresa tu nombre completo:"
                                    value={currentUserName}
                                    onChange={(e) => setCurrentUserName(e.target.value)}
                                    placeholder="Nombre Apellido"
                                    variant="glass"
                                    style={{ color: '#fbbf24', borderColor: '#fbbf24' }} // Custom override for warning look if needed, or stick to variant
                                />
                            </div>
                        )}

                        {/* ... Status Buttons ... */}

                        {/* Conditional Inputs */}
                        {(status === 'EXECUTED' || status === 'REWORK') && weldTypeConfig?.requires_welder !== false && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <SelectNative
                                        label={status === 'REWORK' ? 'Soldador (Retrabajo) *' : 'Soldador *'}
                                        value={welder}
                                        onChange={(e) => {
                                            setWelder(e.target.value)
                                            if (supportWelder === e.target.value) setSupportWelder('')
                                        }}
                                        options={MOCK_WELDERS}
                                        placeholder="Seleccionar..."
                                        variant="glass"
                                    />
                                </div>
                                <div>
                                    <SelectNative
                                        label="Apoyo"
                                        value={supportWelder}
                                        onChange={(e) => setSupportWelder(e.target.value)}
                                        options={MOCK_WELDERS.filter(w => w !== welder)}
                                        placeholder="Ninguno"
                                        variant="glass"
                                    />
                                </div>
                            </div>
                        )}

                        {status === 'REWORK' && (
                            <div style={{ marginBottom: '20px' }}>
                                <SelectNative
                                    label="Motivo *"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    variant="glass"
                                    style={{ color: '#f87171', borderColor: '#f87171' }}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="ERROR_CONTRATISTA">Error Contratista</option>
                                    <option value="ERROR_INGENIERIA">Error Ingeniería</option>
                                </SelectNative>
                            </div>
                        )}

                        {status === 'DELETED' && (
                            <div style={{ marginBottom: '20px' }}>
                                <Textarea
                                    label="Motivo de Eliminación *"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Explique la razón de eliminar esta unión..."
                                    rows={3}
                                    variant="glass"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={!canSave || saving}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: saveSuccess ? '#10b981' : (canSave && !saving ? '#3b82f6' : '#334155'),
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {saving ? 'Guardando...' : (saveSuccess ? '✅ Guardado' : '💾 Guardar Cambios')}
                        </button>
                    </div>

                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <InfoItem label="Diámetro" value={currentWeld.nps || '-'} />
                        <InfoItem label="Schedule" value={currentWeld.sch || '-'} />
                        <InfoItem label="Destino" value={currentWeld.destination || '-'} highlight={currentWeld.destination === 'FIELD'} />
                        <InfoItem label="Spool" value={currentWeld.spool_number} />
                    </div>

                    {/* History */}
                    <WeldHistoryList weldId={weld.id} triggerRefresh={refreshHistoryToken} />

                </div>
            </div>
        </div>,
        container
    )
}

// ----------------------------------------------------------------------
// 5. HELPER COMPONENTS
// ----------------------------------------------------------------------

function StatusButton({ active, disabled, onClick, color, label }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1,
                padding: '10px',
                backgroundColor: active ? color : 'transparent',
                border: `2px solid ${active ? color : '#334155'}`,
                color: active ? '#1e293b' : (disabled ? '#475569' : color),
                borderRadius: '8px',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
            }}
        >
            {label}
        </button>
    )
}



function InfoItem({ label, value, highlight }: any) {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
            <div style={{
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                border: '1px solid #334155',
                color: highlight ? '#fbbf24' : '#e2e8f0',
                fontWeight: highlight ? 600 : 400
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
                console.error(error)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchHistory()
        return () => { mounted = false }
    }, [weldId, triggerRefresh])

    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Cargando historial...</div>
    if (!history.length) return <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px' }}>Sin historial</div>

    return (
        <div style={{ marginTop: '24px' }}>
            <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px' }}>Historial</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map(record => {
                    const userMatch = record.comments?.match(/Usuario:\s*(.+?)(?:\s*\||$)/i)
                    const userName = userMatch ? userMatch[1].trim() : 'Usuario'

                    // Robustly clean the comment
                    let cleanComment = record.comments || ''
                    if (cleanComment.match(/^Usuario:/i)) {
                        const pipeIndex = cleanComment.indexOf('|')
                        if (pipeIndex !== -1) {
                            cleanComment = cleanComment.substring(pipeIndex + 1).trim()
                        } else {
                            cleanComment = '' // Just user tag found
                        }
                    }

                    return (
                        <div key={record.id} style={{
                            padding: '8px 12px',
                            backgroundColor: '#1e293b',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'baseline',
                            gap: '6px',
                            borderLeft: `3px solid ${record.new_status === 'EXECUTED' ? '#4ade80' :
                                (record.new_status === 'REWORK' ? '#10b981' :
                                    (record.new_status === 'DELETED' ? '#94a3b8' : '#334155'))}`
                        }}>
                            <span style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '4px' }}>
                                {new Date(record.changed_at).toLocaleDateString('es-CL')} {new Date(record.changed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{userName}</span>

                            <span style={{ color: '#64748b' }}>cambió a</span>

                            <span style={{
                                fontWeight: 700,
                                color: record.new_status === 'EXECUTED' ? '#4ade80' :
                                    (record.new_status === 'REWORK' ? '#10b981' :
                                        (record.new_status === 'DELETED' ? '#94a3b8' : '#e2e8f0'))
                            }}>
                                {{
                                    'PENDING': 'PENDIENTE',
                                    'EXECUTED': 'EJECUTADA',
                                    'REWORK': 'RETRABAJO',
                                    'DELETED': 'ELIMINADA'
                                }[record.new_status as string] || record.new_status}
                            </span>

                            {cleanComment && (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', marginLeft: '4px' }}>
                                    — {cleanComment}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
