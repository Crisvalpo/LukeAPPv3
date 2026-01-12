'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCompanies, createCompany, type Company } from '@/services/companies'
import { Building2 } from 'lucide-react'
import { ListView } from '@/components/views/ListView'
import { FormView } from '@/components/views/FormView'
import { CompanySchema } from '@/schemas/company'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

export default function CompaniesPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])
    const [showCreateForm, setShowCreateForm] = useState(false)
    useEffect(() => {
        loadCompanies()
    }, [])

    async function loadCompanies() {
        setLoading(true)
        const allCompanies = await getAllCompanies()
        // Filter out the main system company 'lukeapp-hq'
        setCompanies(allCompanies.filter(c => c.slug !== 'lukeapp-hq'))
        setLoading(false)
    }

    function generateSlug(name: string) {
        if (!name) return ''
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }



    if (loading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page companies-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Gestión de Empresas</h1>
                </div>
                <p className="dashboard-subtitle">Administra las empresas que utilizan la plataforma</p>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                {!showCreateForm ? (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="action-button"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                    >
                        <Building2 size={20} />
                        Nueva Empresa
                    </button>
                ) : (
                    <button
                        onClick={() => setShowCreateForm(false)}
                        className="action-button"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                    >
                        Cancelar
                    </button>
                )}
            </div>

            {/* Form Section */}
            {showCreateForm && (
                <div className="company-form-container" style={{ marginBottom: '2rem' }}>
                    <FormView
                        schema={CompanySchema}
                        title="Nueva Empresa"
                        description="Registra una nueva empresa en el sistema"
                        onSubmit={async (data: Partial<Company>) => {
                            setSubmitting(true)
                            setError('')
                            setSuccess(false)

                            const formData = data as any
                            const name = formData.name as string
                            const slug = generateSlug(name)
                            const subscription_tier = formData.subscription_tier
                            const initial_months = formData.initial_months ? Number(formData.initial_months) : undefined

                            const result = await createCompany({ name, slug, subscription_tier, initial_months })

                            if (result.success) {
                                setSuccess(true)
                                loadCompanies()
                                // Optional: Auto-close form on success after short delay or immediately
                                setTimeout(() => {
                                    setShowCreateForm(false)
                                    setSuccess(false)
                                }, 1500)
                            } else {
                                setError(result.message)
                            }
                            setSubmitting(false)
                        }}
                        isSubmitting={submitting}
                    />
                    {/* Success Message outside form or custom handling */}
                    {success && (
                        <div className="company-success" style={{ marginTop: '1rem' }}>
                            <h3 className="company-success-title">✅ Empresa creada exitosamente</h3>
                            <p className="company-success-text">La lista se ha actualizado.</p>
                        </div>
                    )}
                    {error && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Companies List */}
            <div style={{ marginTop: '2rem' }}>
                <ListView
                    schema={CompanySchema}
                    data={companies}
                    isLoading={loading}
                    onAction={(action: string, item: Company) => {
                        if (action === 'view') router.push(`/staff/companies/${item.id}`)
                    }}
                />
            </div>
        </div>
    )
}
