'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCompanies, createCompany, type Company } from '@/services/companies'
import { Icons } from '@/components/ui/Icons'
import { Heading, Text } from '@/components/ui/Typography'
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
                <Text size="base" style={{ textAlign: 'center' }}>Cargando...</Text>
            </div>
        )
    }

    return (
        <div className="dashboard-page companies-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">Gestión de Empresas</Heading>
                </div>
                <Text size="base" className="dashboard-subtitle">Administra las empresas que utilizan la plataforma</Text>
            </div>

            {/* Actions Bar removed - integrated into ListView */}

            {/* Form Section */}

            {/* Form Section */}
            {showCreateForm && (
                <div className="company-form-container">
                    <FormView
                        schema={CompanySchema}
                        title="Nueva Empresa"
                        description="Registra una nueva empresa en el sistema"
                        onCancel={() => setShowCreateForm(false)}
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
                        <div className="company-success">
                            <Heading level={3} className="company-success-title">✅ Empresa creada exitosamente</Heading>
                            <Text size="sm" className="company-success-text">La lista se ha actualizado.</Text>
                        </div>
                    )}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Companies List */}
            <div className="companies-list-wrapper">
                <ListView
                    schema={CompanySchema}
                    data={companies}
                    isLoading={loading}
                    onCreate={!showCreateForm ? () => setShowCreateForm(true) : undefined}
                    onAction={(action: string, item: Company) => {
                        if (action === 'view') router.push(`/staff/companies/${item.id}`)
                    }}
                />
            </div>
        </div>
    )
}
