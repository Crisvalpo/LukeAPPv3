'use client'

// ... (Top of file changes for imports handled by multi_replace usually, but here doing full file context awareness for single replace)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProject } from '@/services/projects'
import { getAllSpecialties } from '@/services/specialties'
import { Specialty } from '@/types'
import { FolderKanban, Check, Layers } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import Confetti from '@/components/onboarding/Confetti'
import Toast from '@/components/onboarding/Toast'
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages'
// Styles migrated to Tailwind v4

export default function NewProjectPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([])
    const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([])

    // Celebration state
    const [showConfetti, setShowConfetti] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        contract_number: '',
        client_name: ''
    })

    useEffect(() => {
        loadFounderCompany()
        loadSpecialties()
    }, [])

    async function loadSpecialties() {
        const specs = await getAllSpecialties()
        setAllSpecialties(specs)

        // Auto-select Piping by default for legacy continuity
        const piping = specs.find(s => s.code === 'PIP')
        if (piping) {
            setSelectedSpecialtyIds([piping.id])
        }
    }

    async function loadFounderCompany() {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

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

        setCompanyId(memberData.company_id)
    }

    function generateCode(name: string) {
        if (!name) return ''

        const cleanName = name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim()

        const words = cleanName.split(/\s+/)

        // Strategy 1: Acronym for multi-word names (e.g. "Mina Los Pelambres" -> "MLP")
        if (words.length > 1) {
            const acronym = words.map(w => w.charAt(0)).join('')
            // If acronym is too short (e.g. "La Mina" -> "LM"), take more chars from first word
            if (acronym.length < 3) {
                return (words[0].substring(0, 3) + words[1].substring(0, 1)).toUpperCase()
            }
            return acronym.substring(0, 6)
        }

        // Strategy 2: Short name for single word (e.g. "Expansion" -> "EXP")
        return cleanName.substring(0, 4)
    }

    function handleNameChange(name: string) {
        // Only auto-update code if user hasn't manually edited it much (heuristic)
        // or always auto-update for now to show "intelligence"
        setFormData(prev => ({
            ...prev,
            name,
            code: generateCode(name)
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!companyId) {
            setError('No se pudo determinar la empresa')
            return
        }

        setIsSubmitting(true)
        setError('')

        const result = await createProject({
            ...formData,
            company_id: companyId,
            specialty_ids: selectedSpecialtyIds
        })

        if (result.success) {
            // Check if this is the first project (Task Complete)
            // We can check this by counting projects BEFORE this one
            // Or simpler: We rely on a quick client-side check if we had 0 projects before

            // To be 100% sure without extra fetch, we can check onboarding status logic or just fetch count
            const supabase = createClient()
            const { count } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)

            // If count is 1 (the one we just created), then it WAS 0 before. 
            // So trigger if count === 1.
            if (count === 1) {
                setShowConfetti(true)
                setToastMessage(CELEBRATION_MESSAGES.projects)
                // Wait for celebration before redirecting
                setTimeout(() => {
                    router.push('/founder/projects')
                }, 3000)
            } else {
                setToastMessage('Proyecto creado correctamente')
                // Quick redirect
                setTimeout(() => {
                    router.push('/founder/projects')
                }, 1000)
            }

            window.dispatchEvent(new Event('onboarding-updated'))
        } else {
            setError(result.message)
            setIsSubmitting(false)
        }
    }

    if (!companyId) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in px-4 md:px-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight">Nuevo Proyecto</Heading>
                </div>
                <Text size="lg" className="text-text-muted max-w-2xl font-medium ml-4.5">
                    Configura los detalles del nuevo proyecto de ingeniería para tu empresa.
                </Text>
            </div>

            {/* Form Container */}
            <div className="bg-bg-surface-1/50 backdrop-blur-xl border border-glass-border rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
                                Nombre del Proyecto <span className="text-brand-primary">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all font-medium"
                                placeholder="Ej: Mina Los Pelambres Fase 2"
                                autoFocus
                            />
                            <Text size="xs" className="text-text-dim ml-1">Nombre descriptivo oficial del proyecto</Text>
                        </div>

                        {/* Specialties Selection */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-brand-primary" />
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                    Especialidades Activas <span className="text-brand-primary">*</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {allSpecialties.map(spec => {
                                    const isSelected = selectedSpecialtyIds.includes(spec.id)
                                    const isAvailable = spec.code === 'PIP'
                                    return (
                                        <div
                                            key={spec.id}
                                            onClick={() => {
                                                if (!isAvailable) return
                                                if (isSelected) {
                                                    setSelectedSpecialtyIds(prev => prev.filter(id => id !== spec.id))
                                                } else {
                                                    setSelectedSpecialtyIds(prev => [...prev, spec.id])
                                                }
                                            }}
                                            className={`
                                                relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                                                ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'}
                                                ${isSelected && isAvailable
                                                    ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                                            `}
                                        >
                                            {!isAvailable && (
                                                <div className="absolute -top-2 -right-1 z-20">
                                                    <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                                                        Próximamente
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold ${isSelected && isAvailable ? 'text-white' : 'text-slate-300'}`}>
                                                    {spec.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                                    {spec.code}
                                                </span>
                                            </div>
                                            <div className={`
                                                w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                                ${isSelected && isAvailable ? 'bg-brand-primary border-brand-primary text-white' : 'border-white/20 text-transparent'}
                                            `}>
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <Text size="xs" className="text-text-dim ml-1">
                                Actualmente enfocado en <b>Piping & AWP Core</b>. Próximamente se habilitarán más disciplinas.
                            </Text>
                        </div>

                        {/* Project Code */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label htmlFor="code" className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                    Código del Proyecto
                                </label>
                                <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                                    AUTOGENERADO
                                </span>
                            </div>
                            <input
                                id="code"
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all font-mono font-bold tracking-wider"
                                placeholder="MLP-F2"
                            />
                            <Text size="xs" className="text-text-dim ml-1">Identificador único corto usado en reportes y tags</Text>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
                                Descripción (Opcional)
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all min-h-[120px] resize-none overflow-hidden hover:overflow-y-auto"
                                placeholder="Describe brevemente el alcance del proyecto..."
                                rows={4}
                            />
                        </div>

                        {/* Contract Details Section */}
                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-brand-primary/50 rounded-full" />
                                <Heading level={3} className="text-sm font-bold text-text-main uppercase tracking-widest">
                                    Información Contractual
                                </Heading>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="client_name" className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
                                        Cliente Principal
                                    </label>
                                    <input
                                        id="client_name"
                                        type="text"
                                        value={formData.client_name || ''}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all"
                                        placeholder="Ej: Minera Escondida"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="contract_number" className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
                                        N° Contrato
                                    </label>
                                    <input
                                        id="contract_number"
                                        type="text"
                                        value={formData.contract_number || ''}
                                        onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all font-mono"
                                        placeholder="Ej: CT-2025-001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            size="lg"
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl px-8 py-6 shadow-xl shadow-brand-primary/20 min-w-[200px]"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => router.push('/founder/projects')}
                            className="text-text-muted hover:text-white hover:bg-white/5 rounded-xl px-8 font-medium"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
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
