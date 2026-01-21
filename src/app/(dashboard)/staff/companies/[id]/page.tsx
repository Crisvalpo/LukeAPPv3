'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanyById, updateCompany, deleteCompanyCascade, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, Trash2, FileText, Mail, Pencil, Save, X, Eraser, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import '@/styles/dashboard.css'
import '@/styles/companies.css'
import CompanyProjectsTab from '@/components/staff/company-tabs/CompanyProjectsTab'
import CompanyMembersTab from '@/components/staff/company-tabs/CompanyMembersTab'
import CompanyInvitationsTab from '@/components/staff/company-tabs/CompanyInvitationsTab'

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [clearingStrikes, setClearingStrikes] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [company, setCompany] = useState<Company | null>(null)
    const [stats, setStats] = useState({ projects: 0, members: 0 })

    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'projects' | 'members' | 'invitations'>('details')

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        subscription_tier: 'starter',
        custom_users_limit: '' as string | number,
        custom_projects_limit: '' as string | number
    })

    useEffect(() => {
        loadCompanyData()
    }, [])

    async function loadCompanyData() {
        setLoading(true)
        const [companyData, statsData] = await Promise.all([
            getCompanyById(resolvedParams.id),
            getCompanyStats(resolvedParams.id)
        ])

        if (companyData) {
            setCompany(companyData)
            setFormData({
                name: companyData.name,
                slug: companyData.slug,
                subscription_tier: companyData.subscription_tier || 'starter',
                custom_users_limit: companyData.custom_users_limit ?? '',
                custom_projects_limit: companyData.custom_projects_limit ?? ''
            })
            setStats(statsData)
        }

        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        const updatePayload = {
            ...formData,
            custom_users_limit: formData.custom_users_limit === '' ? null : Number(formData.custom_users_limit),
            custom_projects_limit: formData.custom_projects_limit === '' ? null : Number(formData.custom_projects_limit)
        }

        const result = await updateCompany(resolvedParams.id, updatePayload)

        if (result.success) {
            setSuccess(true)
            setIsEditing(false)
            loadCompanyData()
        } else {
            setError(result.message)
        }

        setSubmitting(false)
    }

    async function handleDelete() {
        if (!company) return

        // Check suspension status
        if (company.subscription_status !== 'suspended') {
            alert('Solo se pueden eliminar empresas suspendidas.')
            return
        }

        // Calculate days since suspension
        const suspendedAt = company.suspended_at ? new Date(company.suspended_at) : null
        const daysSuspended = suspendedAt
            ? Math.floor((Date.now() - suspendedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0

        if (daysSuspended < 15) {
            alert(`La empresa debe estar suspendida al menos 15 días. Faltan ${15 - daysSuspended} días.`)
            return
        }

        // 1. First Confirmation
        const confirmMsg = `⚠️ ELIMINAR EMPRESA: ${company.name}\n\n` +
            `Esto eliminará PERMANENTEMENTE:\n` +
            `• Todos los proyectos (${stats.projects})\n` +
            `• Todos los miembros (${stats.members})\n` +
            `• Todos los archivos y documentos\n` +
            `• Usuarios sin otra empresa asignada\n\n` +
            `Esta acción NO se puede deshacer.\n` +
            `¿Estás seguro de continuar?`

        if (!confirm(confirmMsg)) return

        // 2. Second Confirmation (Type Name)
        const typedName = prompt(`Para confirmar, escribe el nombre exacto de la empresa:\n"${company.name}"`)
        if (typedName !== company.name) {
            alert('El nombre no coincide. Eliminación cancelada.')
            return
        }

        setDeleting(true)
        setError('')

        const result = await deleteCompanyCascade(resolvedParams.id)

        if (result.success) {
            alert(`✅ Empresa eliminada exitosamente\n\n` +
                `Storage path: ${result.stats?.storage_path || 'N/A'}\n` +
                `Archivos eliminados: ${result.stats?.deleted_files || 0}\n` +
                `Usuarios eliminados: ${result.stats?.deleted_users || 0}`)
            router.push('/staff/companies')
        } else {
            alert(`❌ Error: ${result.message}`)
            setError(result.message)
            setDeleting(false)
        }
    }

    async function handleClearStrikes() {
        if (!confirm('¿Limpiar todos los avisos de cuota para esta empresa?\\n\\nEsto eliminará el banner de advertencia.')) {
            return
        }

        setClearingStrikes(true)
        setError('')

        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const { data, error: rpcError } = await supabase.rpc('clear_company_quota_strikes', {
                p_company_id: resolvedParams.id
            })

            if (rpcError) throw rpcError

            if (data?.success) {
                alert(`✅ ${data.message}\\n\\nLos avisos de cuota han sido eliminados.`)
            } else {
                alert('❌ No se pudieron limpiar los avisos')
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`)
            setError(err.message)
        }

        setClearingStrikes(false)
    }

    function generateSlug(name: string) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }

    function handleNameChange(name: string) {
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name)
        })
    }

    if (loading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Empresa no encontrada</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page companies-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">{company.name}</h1>
                </div>
                <p className="dashboard-subtitle">Detalles y configuración de la empresa</p>
            </div>

            {/* Stats Cards - Always visible or potentially moved to details? Letting them be top level summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div onClick={() => setActiveTab('projects')} className="company-form-container" style={{ padding: '1.5rem', cursor: 'pointer', border: activeTab === 'projects' ? '1px solid #60a5fa' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FolderKanban size={32} color="#60a5fa" />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Proyectos
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.projects}
                                {formData.custom_projects_limit ? <span style={{ fontSize: '1rem', color: '#60a5fa', marginLeft: '0.5rem' }}>/ {formData.custom_projects_limit}</span> : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div onClick={() => setActiveTab('members')} className="company-form-container" style={{ padding: '1.5rem', cursor: 'pointer', border: activeTab === 'members' ? '1px solid #4ade80' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Users size={32} color="#4ade80" />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Miembros
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.members}
                                {formData.custom_users_limit ? <span style={{ fontSize: '1rem', color: '#4ade80', marginLeft: '0.5rem' }}>/ {formData.custom_users_limit}</span> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                    <TabsList variant="underline">
                        <TabsTrigger value="details" variant="underline">
                            <FileText size={16} style={{ marginRight: '8px' }} />
                            Detalles
                        </TabsTrigger>
                        <TabsTrigger value="projects" variant="underline">
                            <FolderKanban size={16} style={{ marginRight: '8px' }} />
                            Proyectos
                        </TabsTrigger>
                        <TabsTrigger value="members" variant="underline">
                            <Users size={16} style={{ marginRight: '8px' }} />
                            Miembros
                        </TabsTrigger>
                        <TabsTrigger value="invitations" variant="underline">
                            <Mail size={16} style={{ marginRight: '8px' }} />
                            Invitaciones
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB CONTENT */}
                <TabsContent value="details">
                    <Card>
                        <CardHeader className="company-card-header">
                            <div className="company-card-title-group">
                                <CardTitle>Información de la Empresa</CardTitle>
                                <CardDescription>
                                    {isEditing ? 'Editando detalles de la empresa' : 'Detalles de la empresa'}
                                </CardDescription>
                            </div>
                            <div className="company-card-actions">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="gap-2"
                                        >
                                            <Pencil size={14} />
                                            Editar
                                        </Button>
                                        {/* Ocultar botón eliminar para empresa genesis */}
                                        {company.slug !== 'lukeapp-hq' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleDelete}
                                                disabled={deleting || company.subscription_status !== 'suspended'}
                                                title={company.subscription_status !== 'suspended'
                                                    ? "La empresa debe estar suspendida para eliminarse"
                                                    : "Eliminar empresa permanentemente"}
                                                className="gap-2"
                                            >
                                                <Trash2 size={14} />
                                                {deleting ? 'Eliminando...' : 'Eliminar'}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {success && (
                                <Alert className="company-success">
                                    <AlertTitle className="company-success-title flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Cambios guardados
                                    </AlertTitle>
                                    <AlertDescription className="company-success-text">La información se actualizó correctamente</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="company-form-spacer">
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="company-form-grid">
                                    <div className="form-field">
                                        <label htmlFor="name" className="form-label">
                                            Nombre de la Empresa *
                                        </label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            disabled={!isEditing}
                                            value={formData.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="Minera Candelaria"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="slug" className="form-label">
                                            Slug (URL) *
                                        </label>
                                        <Input
                                            id="slug"
                                            type="text"
                                            required
                                            disabled={true}
                                            value={formData.slug}
                                            className="opacity-70 cursor-not-allowed"
                                            placeholder="minera-candelaria"
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="subscription_tier" className="form-label form-label-blue">
                                        Plan de Suscripción *
                                    </label>
                                    <Select
                                        disabled={!isEditing}
                                        value={formData.subscription_tier}
                                        onValueChange={(val) => setFormData({ ...formData, subscription_tier: val as any })}
                                    >
                                        <SelectTrigger className="select-trigger-blue">
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="starter">Starter</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="form-hint">Determina los límites base y el costo.</p>
                                </div>

                                {/* Clear Quota Strikes Button */}
                                {!isEditing && (
                                    <Alert variant="warning" className="alert-quota">
                                        <div className="alert-quota-content">
                                            <AlertTitle className="alert-quota-title">
                                                <AlertTriangle size={16} />
                                                Limpiar Avisos de Cuota
                                            </AlertTitle>
                                            <AlertDescription className="alert-quota-desc">
                                                Elimina strikes acumulados y borra el banner de advertencia
                                            </AlertDescription>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearStrikes}
                                            disabled={clearingStrikes}
                                            className="btn-quota gap-2"
                                        >
                                            <Eraser size={14} />
                                            {clearingStrikes ? 'Limpiando...' : 'Limpiar Avisos'}
                                        </Button>
                                    </Alert>
                                )}


                                {/* Custom Limits Section */}
                                <div className="company-form-divider">
                                    <h3 className="company-form-divider-title flex items-center gap-2">
                                        <Zap size={16} />
                                        Límites Personalizados (Overrides)
                                    </h3>
                                    <div className="company-form-grid">
                                        <div className="form-field">
                                            <label htmlFor="custom_users_limit" className="form-label form-label-amber">
                                                Máximo Usuarios
                                            </label>
                                            <Input
                                                id="custom_users_limit"
                                                type="number"
                                                min="0"
                                                disabled={!isEditing}
                                                value={formData.custom_users_limit}
                                                onChange={(e) => setFormData({ ...formData, custom_users_limit: e.target.value })}
                                                className={formData.custom_users_limit ? 'input-amber' : ''}
                                                placeholder="Dejar vacío para usar límite del plan"
                                            />
                                            <p className="form-hint">Sobreescribe el límite del Plan</p>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="custom_projects_limit" className="form-label form-label-amber">
                                                Máximo Proyectos
                                            </label>
                                            <Input
                                                id="custom_projects_limit"
                                                type="number"
                                                min="0"
                                                disabled={!isEditing}
                                                value={formData.custom_projects_limit}
                                                onChange={(e) => setFormData({ ...formData, custom_projects_limit: e.target.value })}
                                                className={formData.custom_projects_limit ? 'input-amber' : ''}
                                                placeholder="Dejar vacío para usar límite del plan"
                                            />
                                            <p className="form-hint">Sobreescribe el límite del Plan</p>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="company-form-footer">
                                        <Button type="submit" disabled={submitting} className="gap-2">
                                            <Save size={16} />
                                            {submitting ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditing(false)
                                                setFormData({
                                                    name: company.name,
                                                    slug: company.slug,
                                                    subscription_tier: company.subscription_tier || 'starter',
                                                    custom_users_limit: company.custom_users_limit ?? '',
                                                    custom_projects_limit: company.custom_projects_limit ?? ''
                                                })
                                                setError('')
                                            }}
                                            className="gap-2"
                                        >
                                            <X size={16} />
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="projects">
                    <CompanyProjectsTab companyId={resolvedParams.id} />
                </TabsContent>

                <TabsContent value="members">
                    <CompanyMembersTab companyId={resolvedParams.id} />
                </TabsContent>

                <TabsContent value="invitations">
                    {company && (
                        <CompanyInvitationsTab
                            companyId={resolvedParams.id}
                            companyName={company.name}
                            companySlug={company.slug}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div >
    )
}
