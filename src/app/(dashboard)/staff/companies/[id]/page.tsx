'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanyById, updateCompany, deleteCompanyCascade, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, Trash2, FileText, Mail, Pencil, Save, X, Eraser, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heading, Text } from '@/components/ui/Typography'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// Styles migrated to Tailwind v4
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
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Cargando datos de la empresa...</p>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <div className="p-4 bg-red-500/10 rounded-full text-red-400">
                    <AlertTriangle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-white">Empresa no encontrada</h2>
                <Button onClick={() => router.push('/staff/companies')} variant="outline">Volver a la lista</Button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <Heading level={1} className="text-white tracking-tight">
                                {company.name}
                            </Heading>
                        </div>
                        <p className="text-slate-400 text-sm font-medium ml-5">
                            Detalles y configuración técnica de la organización
                        </p>
                    </div>

                    <div className="flex items-center gap-3 ml-5 md:ml-0">
                        <span className={`
                            px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border
                            ${company.subscription_status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'}
                        `}>
                            {company.subscription_status === 'active' ? '● ACTIVA' : '● SUSPENDIDA'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    onClick={() => setActiveTab('projects')}
                    className={`
                        group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 cursor-pointer
                        ${activeTab === 'projects'
                            ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/20'
                            : 'bg-white/[0.02] border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04]'}
                    `}
                >
                    <div className="flex items-center gap-5 relative z-10">
                        <div className={`
                            p-4 rounded-xl transition-all duration-300
                            ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow-xl rotate-3' : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:rotate-6'}
                        `}>
                            <FolderKanban size={32} />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Proyectos</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{stats.projects}</span>
                                {formData.custom_projects_limit && (
                                    <span className="text-3xl font-bold text-blue-400 leading-none">/ {formData.custom_projects_limit}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100" />
                </div>

                <div
                    onClick={() => setActiveTab('members')}
                    className={`
                        group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 cursor-pointer
                        ${activeTab === 'members'
                            ? 'bg-emerald-600/10 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                            : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04]'}
                    `}
                >
                    <div className="flex items-center gap-5 relative z-10">
                        <div className={`
                            p-4 rounded-xl transition-all duration-300
                            ${activeTab === 'members' ? 'bg-emerald-600 text-white shadow-xl -rotate-3' : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:-rotate-6'}
                        `}>
                            <Users size={32} />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Miembros Activos</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">{stats.members}</span>
                                {formData.custom_users_limit && (
                                    <span className="text-3xl font-bold text-emerald-400 leading-none">/ {formData.custom_users_limit}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100" />
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                <TabsList className="flex items-center gap-10 bg-transparent p-0 border-b border-white/5 rounded-none mb-10 w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-hide">
                    <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-blue-500 border-b-2 border-transparent px-0 pb-4 pt-0 font-bold text-slate-500 rounded-none transition-all flex items-center gap-2.5 hover:text-slate-300"
                    >
                        <FileText size={16} />
                        <span className="tracking-wide">Detalles Técnicos</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="projects"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-blue-500 border-b-2 border-transparent px-0 pb-4 pt-0 font-bold text-slate-500 rounded-none transition-all flex items-center gap-2.5 hover:text-slate-300"
                    >
                        <FolderKanban size={16} />
                        <span className="tracking-wide">Gestión de Proyectos</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="members"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-blue-500 border-b-2 border-transparent px-0 pb-4 pt-0 font-bold text-slate-500 rounded-none transition-all flex items-center gap-2.5 hover:text-slate-300"
                    >
                        <Users size={16} />
                        <span className="tracking-wide">Administración de Equipo</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="invitations"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-blue-500 border-b-2 border-transparent px-0 pb-4 pt-0 font-bold text-slate-500 rounded-none transition-all flex items-center gap-2.5 hover:text-slate-300"
                    >
                        <Mail size={16} />
                        <span className="tracking-wide">Invitaciones Enviadas</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB CONTENT - DETAILS */}
                <TabsContent value="details" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                        <CardHeader className="px-8 py-6 border-b border-white/5 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-white">Configuración de la Empresa</CardTitle>
                                <CardDescription className="text-slate-400 mt-1">
                                    {isEditing ? 'Estás editando los parámetros técnicos del sistema' : 'Visualización de metadatos y límites de cuota'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 border-white/10 hover:bg-white/5 text-slate-200 gap-2"
                                        >
                                            <Pencil size={14} />
                                            <span>Editar Datos</span>
                                        </Button>
                                        {company.slug !== 'lukeapp-hq' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleDelete}
                                                disabled={deleting || company.subscription_status !== 'suspended'}
                                                className="px-4 gap-2 shadow-lg shadow-red-900/20"
                                            >
                                                <Trash2 size={14} />
                                                <span>{deleting ? 'Eliminando...' : 'Borrar Sistema'}</span>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            {success && (
                                <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
                                    <CheckCircle className="text-emerald-400" size={20} />
                                    <div>
                                        <div className="text-emerald-400 font-bold">Cambios sincronizados</div>
                                        <div className="text-emerald-400/70 text-sm">La base de datos se ha actualizado correctamente.</div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                                        <AlertTriangle size={20} />
                                        <span className="font-semibold">{error}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                            Nombre Comercial *
                                        </label>
                                        <Input
                                            id="name"
                                            required
                                            disabled={!isEditing}
                                            value={formData.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            className="bg-black/20 border-white/5 rounded-xl px-4 py-6 focus:ring-blue-500/20 text-white font-medium disabled:opacity-50"
                                            placeholder="Ej: Constructora Delta"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="slug" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                            Slug Identificador (URL)
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="slug"
                                                required
                                                disabled={true}
                                                value={formData.slug}
                                                className="bg-black/10 border-white/5 rounded-xl px-4 py-6 text-slate-400 italic opacity-60"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold tracking-tighter uppercase">No editable</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subscription_tier" className="text-xs font-black uppercase tracking-widest text-blue-400 ml-1">
                                        Nivel de Suscripción (Plan) *
                                    </label>
                                    <Select
                                        disabled={!isEditing}
                                        value={formData.subscription_tier}
                                        onValueChange={(val) => setFormData({ ...formData, subscription_tier: val as any })}
                                    >
                                        <SelectTrigger className="bg-black/20 border-white/5 rounded-xl px-4 py-6 text-white font-bold h-auto focus:ring-blue-500/20">
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="starter" className="focus:bg-blue-600 focus:text-white">Starter - Básico</SelectItem>
                                            <SelectItem value="pro" className="focus:bg-blue-600 focus:text-white">Pro - Profesional</SelectItem>
                                            <SelectItem value="enterprise" className="focus:bg-blue-600 focus:text-white">Enterprise - Corporativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-slate-500 font-medium italic mt-1 ml-1">Este plan define las capacidades máximas por defecto del sistema.</p>
                                </div>

                                {/* Quota Management Alert */}
                                {!isEditing && (
                                    <div className="p-6 bg-slate-900/60 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">Limpiar Avisos de Cuota</h4>
                                                <p className="text-slate-500 text-sm mt-0.5">Elimina strikes acumulados por exceso de uso y borra el banner de advertencia.</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClearStrikes}
                                            disabled={clearingStrikes}
                                            className="px-6 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 gap-2 shrink-0 h-11"
                                        >
                                            <Eraser size={16} />
                                            <span>{clearingStrikes ? 'Procesando...' : 'Limpiar Historial'}</span>
                                        </Button>
                                    </div>
                                )}

                                {/* Custom Limits Section */}
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-md">
                                            <Zap size={16} />
                                        </div>
                                        <h3 className="text-lg font-extrabold text-white">Límites Personalizados (Overrides)</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label htmlFor="custom_users_limit" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                                Límite Máximo de Usuarios
                                            </label>
                                            <Input
                                                id="custom_users_limit"
                                                type="number"
                                                min="0"
                                                disabled={!isEditing}
                                                value={formData.custom_users_limit}
                                                onChange={(e) => setFormData({ ...formData, custom_users_limit: e.target.value })}
                                                className={`
                                                    bg-black/20 border-white/5 rounded-xl px-4 py-6 font-bold disabled:opacity-50
                                                    ${formData.custom_users_limit ? 'text-amber-400 border-amber-500/20' : 'text-white'}
                                                `}
                                                placeholder="Dejar vacío para usar límite del plan"
                                            />
                                            <p className="text-[10px] text-slate-600 font-medium ml-1">Sobreescribe el límite configurado por el Plan de Suscripción.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="custom_projects_limit" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                                Límite Máximo de Proyectos
                                            </label>
                                            <Input
                                                id="custom_projects_limit"
                                                type="number"
                                                min="0"
                                                disabled={!isEditing}
                                                value={formData.custom_projects_limit}
                                                onChange={(e) => setFormData({ ...formData, custom_projects_limit: e.target.value })}
                                                className={`
                                                    bg-black/20 border-white/5 rounded-xl px-4 py-6 font-bold disabled:opacity-50
                                                    ${formData.custom_projects_limit ? 'text-amber-400 border-amber-500/20' : 'text-white'}
                                                `}
                                                placeholder="Dejar vacío para usar límite del plan"
                                            />
                                            <p className="text-[10px] text-slate-600 font-medium ml-1">Controla la cantidad de despliegues permitidos para la organización.</p>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex items-center gap-4 pt-8 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-8 h-12 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-xl shadow-blue-900/30 gap-2 active:scale-95 transition-all"
                                        >
                                            <Save size={18} />
                                            <span>{submitting ? 'Sincronizando...' : 'Guardar Cambios'}</span>
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
                                            className="px-6 h-12 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold gap-2"
                                        >
                                            <X size={18} />
                                            <span>Descartar</span>
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB CONTENT - PROJECTS */}
                <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-none outline-none">
                    <div className="bg-slate-900/20 rounded-2xl p-1">
                        <CompanyProjectsTab companyId={resolvedParams.id} />
                    </div>
                </TabsContent>

                {/* TAB CONTENT - MEMBERS */}
                <TabsContent value="members" className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-none outline-none">
                    <div className="bg-slate-900/20 rounded-2xl p-1">
                        <CompanyMembersTab companyId={resolvedParams.id} />
                    </div>
                </TabsContent>

                {/* TAB CONTENT - INVITATIONS */}
                <TabsContent value="invitations" className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-none outline-none">
                    <div className="bg-slate-900/20 rounded-2xl p-1">
                        {company && (
                            <CompanyInvitationsTab
                                companyId={resolvedParams.id}
                                companyName={company.name}
                                companySlug={company.slug}
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    )
}

