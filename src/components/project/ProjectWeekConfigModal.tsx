'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Save, AlertCircle } from 'lucide-react'

interface ProjectWeekConfigModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    onSave?: () => void
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
]

export default function ProjectWeekConfigModal({ isOpen, onClose, projectId, onSave }: ProjectWeekConfigModalProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [configMode, setConfigMode] = useState<'date' | 'week'>('date')
    const [startDate, setStartDate] = useState('')
    const [currentWeekInput, setCurrentWeekInput] = useState<string>('')
    const [weekEndDay, setWeekEndDay] = useState(6)
    const [calculatedWeek, setCalculatedWeek] = useState<number | null>(null)
    const [calculatedDay, setCalculatedDay] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadConfig()
        }
    }, [isOpen, projectId])

    useEffect(() => {
        if (configMode === 'date' && startDate) {
            calculateWeek()
        } else if (configMode === 'date') {
            setCalculatedWeek(null)
            setCalculatedDay(null)
        }
    }, [startDate, configMode])

    useEffect(() => {
        if (configMode === 'week' && currentWeekInput) {
            calculateDateFromWeek()
        } else if (configMode === 'week') {
            setStartDate('')
        }
    }, [currentWeekInput, configMode])

    async function loadConfig() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/projects/${projectId}/week-config`)
            const json = await res.json()

            if (json.success) {
                setStartDate(json.data.start_date || '')
                setWeekEndDay(json.data.week_end_day ?? 6)
                setCalculatedWeek(json.data.current_week)
                setCalculatedDay(json.data.project_day)
            } else {
                setError(json.error)
            }
        } catch (err) {
            console.error('Error loading config:', err)
            setError('Error al cargar configuración')
        } finally {
            setLoading(false)
        }
    }

    function calculateWeek() {
        if (!startDate) {
            setCalculatedWeek(null)
            setCalculatedDay(null)
            return
        }

        const start = new Date(startDate)
        const today = new Date()
        const diffTime = today.getTime() - start.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
            setCalculatedWeek(null)
            setCalculatedDay(null)
        } else {
            const week = Math.floor(diffDays / 7) + 1
            setCalculatedWeek(week)
            setCalculatedDay(diffDays)
        }
    }

    function calculateDateFromWeek() {
        const weekNum = parseInt(currentWeekInput)

        if (!weekNum || weekNum < 1) {
            setStartDate('')
            setCalculatedWeek(null)
            setCalculatedDay(null)
            return
        }

        const today = new Date()
        const daysToSubtract = (weekNum - 1) * 7
        const calculatedDate = new Date(today.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000))

        const year = calculatedDate.getFullYear()
        const month = String(calculatedDate.getMonth() + 1).padStart(2, '0')
        const day = String(calculatedDate.getDate()).padStart(2, '0')

        setStartDate(`${year}-${month}-${day}`)
        setCalculatedWeek(weekNum)
        setCalculatedDay(daysToSubtract)
    }

    async function handleSave() {
        if (!startDate) {
            setError('Debe especificar la fecha de inicio del proyecto')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const res = await fetch(`/api/projects/${projectId}/week-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_date: startDate,
                    week_end_day: weekEndDay
                })
            })

            const json = await res.json()

            if (json.success) {
                if (onSave) onSave()
                onClose()
            } else {
                setError(json.error || 'Error al guardar')
            }
        } catch (err) {
            console.error('Error saving config:', err)
            setError('Error al guardar configuración')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '42rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: 0
                        }}>
                            <Calendar size={24} color="#a78bfa" />
                            Configuración de Semanas del Proyecto
                        </h2>
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginTop: '0.25rem',
                            marginBottom: 0
                        }}>
                            Define cuándo comenzó el proyecto y el ciclo semanal
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingTop: '3rem',
                            paddingBottom: '3rem'
                        }}>
                            <div style={{
                                width: '2rem',
                                height: '2rem',
                                border: '2px solid rgba(139, 92, 246, 0.3)',
                                borderTop: '2px solid #8b5cf6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Error Message */}
                            {error && (
                                <div style={{
                                    background: 'rgba(127, 29, 29, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem'
                                }}>
                                    <AlertCircle size={20} color="#f87171" style={{ marginTop: '2px' }} />
                                    <p style={{ color: '#fecaca', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                                </div>
                            )}

                            {/* Mode Toggle */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                padding: '0.25rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setConfigMode('date')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s',
                                        background: configMode === 'date' ? '#8b5cf6' : 'transparent',
                                        color: configMode === 'date' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: configMode === 'date' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none'
                                    }}
                                >
                                    📅 Fecha de Inicio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfigMode('week')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s',
                                        background: configMode === 'week' ? '#8b5cf6' : 'transparent',
                                        color: configMode === 'week' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: configMode === 'week' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none'
                                    }}
                                >
                                    🔢 Semana Actual
                                </button>
                            </div>

                            {/* Mode: Start Date */}
                            {configMode === 'date' && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: 'white',
                                        fontWeight: 500,
                                        marginBottom: '0.5rem'
                                    }}>
                                        📅 Fecha de Inicio del Proyecto
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                    <p style={{
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.75rem',
                                        marginTop: '0.5rem',
                                        marginBottom: 0
                                    }}>
                                        Fecha en que oficialmente comenzó el proyecto
                                    </p>
                                </div>
                            )}

                            {/* Mode: Current Week */}
                            {configMode === 'week' && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: 'white',
                                        fontWeight: 500,
                                        marginBottom: '0.5rem'
                                    }}>
                                        🔢 ¿En qué semana están actualmente?
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Ej: 90"
                                        value={currentWeekInput}
                                        onChange={(e) => setCurrentWeekInput(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                    <p style={{
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.75rem',
                                        marginTop: '0.5rem',
                                        marginBottom: 0
                                    }}>
                                        El sistema calculará automáticamente la fecha de inicio
                                    </p>
                                    {startDate && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem',
                                            background: 'rgba(109, 40, 217, 0.2)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '8px'
                                        }}>
                                            <p style={{ color: '#e9d5ff', fontSize: '0.875rem', margin: 0 }}>
                                                📅 Fecha de inicio calculada: <span style={{ fontWeight: 600 }}>{new Date(startDate).toLocaleDateString('es-CL')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Week End Day */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: 'white',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem'
                                }}>
                                    🗓️ Día de Cierre Semanal
                                </label>
                                <select
                                    value={weekEndDay}
                                    onChange={(e) => setWeekEndDay(parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '0.75rem 1rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day.value} value={day.value} style={{ background: '#0f172a' }}>
                                            {day.label}
                                        </option>
                                    ))}
                                </select>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.75rem',
                                    marginTop: '0.5rem',
                                    marginBottom: 0
                                }}>
                                    Día que considera como cierre de semana (para reportes semanales)
                                </p>
                            </div>

                            {/* Calculated Information */}
                            {startDate && (
                                <div style={{
                                    background: 'rgba(109, 40, 217, 0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem'
                                }}>
                                    <h3 style={{
                                        color: 'white',
                                        fontWeight: 600,
                                        marginBottom: '0.75rem',
                                        marginTop: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '1rem'
                                    }}>
                                        <Calendar size={16} color="#a78bfa" />
                                        Información Calculada
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <p style={{ color: '#e9d5ff', fontSize: '0.875rem', marginBottom: '0.25rem', marginTop: 0 }}>Semana Actual</p>
                                            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                                {calculatedWeek !== null ? `Semana ${calculatedWeek}` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: '#e9d5ff', fontSize: '0.875rem', marginBottom: '0.25rem', marginTop: 0 }}>Días Transcurridos</p>
                                            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                                {calculatedDay !== null ? `Día ${calculatedDay}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px'
                }}>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            padding: '0.5rem 1.5rem',
                            color: 'rgba(255, 255, 255, 0.7)',
                            background: 'transparent',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            transition: 'color 0.2s',
                            opacity: saving ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => !saving && (e.currentTarget.style.color = 'white')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !startDate}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: (saving || !startDate) ? '#6d28d9' : '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 500,
                            cursor: (saving || !startDate) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: (saving || !startDate) ? 0.5 : 1,
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!saving && startDate) {
                                e.currentTarget.style.background = '#7c3aed'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = (saving || !startDate) ? '#6d28d9' : '#8b5cf6'
                        }}
                    >
                        {saving ? (
                            <span style={{
                                width: '1rem',
                                height: '1rem',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                display: 'inline-block'
                            }} />
                        ) : (
                            <Save size={18} />
                        )}
                        Guardar Configuración
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
