'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Save, AlertCircle, Loader2 } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg-surface-1 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden glass-panel">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <Heading level={2} size="xl">Configuración de Semanas</Heading>
                            <Text variant="muted" size="sm">Define el inicio del proyecto y el ciclo semanal</Text>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                    >
                        <X size={24} />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                            <Text variant="muted">Cargando configuración...</Text>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
                                    <Text className="text-red-200/80 text-sm">{error}</Text>
                                </div>
                            )}

                            {/* Mode Toggle */}
                            <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setConfigMode('date')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${configMode === 'date'
                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    📅 Fecha de Inicio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfigMode('week')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${configMode === 'week'
                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    🔢 Semana Actual
                                </button>
                            </div>

                            {/* Mode: Start Date */}
                            {configMode === 'date' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-white/80 ml-1">
                                        Fecha de Inicio del Proyecto
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                                    />
                                    <Text variant="muted" size="xs" className="ml-1">
                                        Fecha en que oficialmente comenzó el proyecto
                                    </Text>
                                </div>
                            )}

                            {/* Mode: Current Week */}
                            {configMode === 'week' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-white/80 ml-1">
                                            ¿En qué semana están actualmente?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Ej: 90"
                                            value={currentWeekInput}
                                            onChange={(e) => setCurrentWeekInput(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                                        />
                                        <Text variant="muted" size="xs" className="ml-1">
                                            El sistema calculará automáticamente la fecha de inicio
                                        </Text>
                                    </div>
                                    {startDate && (
                                        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                                            <Text className="text-brand-primary/90 text-sm font-medium">
                                                📅 Fecha de inicio calculada: <span className="text-white font-bold ml-1">{new Date(startDate).toLocaleDateString('es-CL')}</span>
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Week End Day */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-white/80 ml-1">
                                    Día de Cierre Semanal
                                </label>
                                <select
                                    value={weekEndDay}
                                    onChange={(e) => setWeekEndDay(parseInt(e.target.value))}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all cursor-pointer appearance-none"
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day.value} value={day.value} className="bg-bg-surface-1 text-white">
                                            {day.label}
                                        </option>
                                    ))}
                                </select>
                                <Text variant="muted" size="xs" className="ml-1">
                                    Día que considera como cierre de semana (para reportes semanales)
                                </Text>
                            </div>

                            {/* Calculated Information */}
                            {startDate && (
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-brand-primary">
                                        <Calendar size={18} />
                                        <Text className="font-bold text-sm tracking-wide uppercase">Información Calculada</Text>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                            <Text variant="muted" size="xs" className="mb-1">Semana Actual</Text>
                                            <Text className="text-2xl font-bold text-white">
                                                {calculatedWeek !== null ? `Semana ${calculatedWeek}` : '-'}
                                            </Text>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                                            <Text variant="muted" size="xs" className="mb-1">Días Transcurridos</Text>
                                            <Text className="text-2xl font-bold text-white">
                                                {calculatedDay !== null ? `Día ${calculatedDay}` : '-'}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={saving}
                        className="text-white/60 hover:text-white"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !startDate}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 shadow-lg shadow-brand-primary/20"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                Guardar Configuración
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
