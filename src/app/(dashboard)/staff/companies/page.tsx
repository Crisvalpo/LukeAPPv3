'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCompanies, createCompany, deleteCompanyCascade, type Company } from '@/services/companies'
import { Icons } from '@/components/ui/Icons'
import { Heading, Text } from '@/components/ui/Typography'
import { ListView } from '@/components/views/ListView'
import { FormView } from '@/components/views/FormView'
import { CompanySchema } from '@/schemas/company'

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
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <Text size="base" className="text-slate-400 animate-pulse font-medium">Cargando empresas...</Text>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="relative">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="text-white tracking-tight">Gestión de Empresas</Heading>
                    </div>
                    <Text size="base" className="text-slate-400 text-sm font-medium ml-4.5">
                        Administra las empresas y sus suscripciones en la plataforma
                    </Text>
                </div>
            </div>

            {/* Form Section */}
            {showCreateForm && (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-xl">
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
                    {/* Success Message */}
                    {success && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
                            <span className="text-2xl text-emerald-400">✨</span>
                            <div>
                                <Heading level={3} className="text-emerald-400 font-bold">Empresa creada exitosamente</Heading>
                                <Text size="sm" className="text-emerald-400/70">La lista se ha actualizado automáticamente.</Text>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Companies List */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <ListView
                    schema={CompanySchema}
                    data={companies}
                    isLoading={loading}
                    onCreate={!showCreateForm ? () => setShowCreateForm(true) : undefined}
                    onAction={async (action: string, item: Company) => {
                        if (action === 'view') {
                            router.push(`/staff/companies/${item.id}`)
                        } else if (action === 'delete') {
                            // Check if suspended
                            if (item.subscription_status !== 'suspended') {
                                alert('Solo se pueden eliminar empresas suspendidas por más de 15 días')
                                return
                            }

                            // Calculate days since suspension
                            const suspendedAt = item.suspended_at ? new Date(item.suspended_at) : null
                            const daysSuspended = suspendedAt
                                ? Math.floor((Date.now() - suspendedAt.getTime()) / (1000 * 60 * 60 * 24))
                                : 0

                            if (daysSuspended < 15) {
                                alert(`La empresa debe estar suspendida al menos 15 días. Faltan ${15 - daysSuspended} días.`)
                                return
                            }

                            const confirmMsg = `⚠️ ELIMINAR EMPRESA: ${item.name}\n\n` +
                                `Esto eliminará PERMANENTEMENTE:\n` +
                                `• Todos los proyectos\n` +
                                `• Todos los miembros\n` +
                                `• Todos los archivos (${item.projects_count || 0} proyectos)\n` +
                                `• Usuarios huérfanos (solo de esta empresa)\n\n` +
                                `Días suspendido: ${daysSuspended}\n\n` +
                                `Esta acción NO se puede deshacer.\n\n` +
                                `¿Estás completamente seguro?`

                            if (!confirm(confirmMsg)) return

                            // Second confirmation
                            const typedName = prompt(`Para confirmar, escribe el nombre de la empresa:\n"${item.name}"`)
                            if (typedName !== item.name) {
                                alert('El nombre no coincide. Eliminación cancelada.')
                                return
                            }

                            // Execute deletion
                            setLoading(true)
                            const result = await deleteCompanyCascade(item.id)
                            setLoading(false)

                            if (result.success) {
                                alert(`✅ Empresa eliminada exitosamente\n\n` +
                                    `Storage path: ${result.stats?.storage_path || 'N/A'}\n` +
                                    `Archivos eliminados: ${result.stats?.deleted_files || 0}\n` +
                                    `Usuarios eliminados: ${result.stats?.deleted_users || 0}`)
                                loadCompanies()
                            } else {
                                alert(`❌ Error: ${result.message}`)
                            }
                        }
                    }}
                />
            </div>
        </div>
    )
}
