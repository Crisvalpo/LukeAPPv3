'use client'

// ... (Top of file changes for imports handled by multi_replace usually, but here doing full file context awareness for single replace)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProject } from '@/services/projects'
import { FolderKanban } from 'lucide-react'
import Confetti from '@/components/onboarding/Confetti'
import Toast from '@/components/onboarding/Toast'
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

export default function NewProjectPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [companyId, setCompanyId] = useState<string | null>(null)

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
    }, [])

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
            company_id: companyId
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
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Nuevo Proyecto</h1>
                </div>
                <p className="dashboard-subtitle">Crea un nuevo proyecto para tu empresa</p>
            </div>

            {/* Form */}
            <div className="company-form-container">
                <form onSubmit={handleSubmit} className="company-form">
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div className="company-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                        <div className="form-field">
                            <label htmlFor="name" className="form-label">
                                Nombre del Proyecto *
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="form-input"
                                placeholder="Ej: Mina Los Pelambres Fase 2"
                                autoFocus
                            />
                            <span className="form-hint">Nombre descriptivo del proyecto</span>
                        </div>

                        <div className="form-field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="code" className="form-label" style={{ marginBottom: 0 }}>
                                    Código Sugerido
                                </label>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    AUTOGENERADO
                                </span>
                            </div>
                            <input
                                id="code"
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="form-input"
                                style={{
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.05em',
                                    fontWeight: '700',
                                    background: 'var(--color-bg-surface-2)',
                                    borderColor: 'var(--color-primary-glow)'
                                }}
                                placeholder="MLP-F2"
                            />
                            <span className="form-hint">Identificador único corto (usado en reportes y tags)</span>
                        </div>

                        <div className="form-field">
                            <label htmlFor="description" className="form-label">
                                Descripción (Opcional)
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="form-input"
                                placeholder="Describe brevemente el proyecto..."
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                            <span className="form-hint">Información adicional sobre el proyecto</span>
                        </div>

                        {/* Contract Details Section */}
                        <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></span>
                                Información Contractual
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-field">
                                    <label htmlFor="client_name" className="form-label">
                                        Cliente Principal
                                    </label>
                                    <input
                                        id="client_name"
                                        type="text"
                                        value={formData.client_name || ''}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="form-input"
                                        placeholder="Ej: Minera Escondida"
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="contract_number" className="form-label">
                                        N° Contrato
                                    </label>
                                    <input
                                        id="contract_number"
                                        type="text"
                                        value={formData.contract_number || ''}
                                        onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                                        className="form-input"
                                        placeholder="Ej: CT-2025-001"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="form-button"
                        >
                            {isSubmitting ? 'Creando...' : '🚀 Crear Proyecto'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/founder/projects')}
                            className="form-button"
                            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                        >
                            Cancelar
                        </button>
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
