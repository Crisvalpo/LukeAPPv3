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
    useEffect(() => {
        loadCompanies()
    }, [])

    async function loadCompanies() {
        setLoading(true)
        const data = await getAllCompanies()
        setCompanies(data)
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

            {/* Form Section */}
            <div className="company-form-container">
                <FormView
                    schema={CompanySchema}
                    title="Nueva Empresa"
                    description="Registra una nueva empresa en el sistema"
                    onSubmit={async (data: Partial<Company>) => {
                        setSubmitting(true)
                        setError('')
                        setSuccess(false)

                        // If slug is not provided, we might need to generate it, 
                        // but the current schema marks it as readOnly, so FormView ignores it.
                        // However, the backend/service expects it.
                        // We need to handle this discrepancy.
                        // Ideally, slugs are auto-generated.
                        // For now we will auto-generate it here as we did before.

                        const name = data.name as string
                        const slug = generateSlug(name)

                        const result = await createCompany({ name, slug })

                        if (result.success) {
                            setSuccess(true)
                            loadCompanies()
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
                        <p className="company-success-text">Ahora puedes invitar founders para esta empresa</p>
                    </div>
                )}
                {error && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                        {error}
                    </div>
                )}
            </div>

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
