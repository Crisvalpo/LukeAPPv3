'use client'

import { useState, useEffect } from 'react'
import { Copy, Mail, MessageCircle, Trash2, UserPlus, Shield, CheckCircle2, QrCode } from 'lucide-react'
import { Project, CompanyRole, Specialty } from '@/types'
import { Invitation } from '@/services/invitations'
import { getCompanyRoles } from '@/services/roles'
import { getProjectSpecialties, getAllSpecialties } from '@/services/specialties'
import Confetti from '@/components/onboarding/Confetti'
import Toast from '@/components/onboarding/Toast'
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/Icons'
import { Text } from '@/components/ui/Typography'

interface InvitationManagerProps {
    companyId: string
    projects?: Project[]
    invitations: Invitation[]
    companyName?: string
    requireProject?: boolean
    fixedProjectId?: string
    roleOptions?: { value: string; label: string; description: string }[]
    onInvite: (data: {
        email: string
        project_id?: string
        role_id: string
        functional_role_id?: string
        job_title: string
        primary_specialty_id?: string
    }) => Promise<{ success: boolean; message?: string; data?: { link: string } }>
    onRevoke: (id: string) => Promise<void>
}

export default function InvitationManager({
    companyId,
    projects = [],
    invitations,
    companyName,
    requireProject = true,
    fixedProjectId,
    roleOptions = [
        { value: 'admin', label: 'Administrador de Proyecto', description: 'Gestión total de spools, personal y reportes.' }
    ],
    onInvite,
    onRevoke
}: InvitationManagerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [invitationLink, setInvitationLink] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const [functionalRoles, setFunctionalRoles] = useState<CompanyRole[]>([])
    const [loadingRoles, setLoadingRoles] = useState(true)
    const [showConfetti, setShowConfetti] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([])
    const [loadingSpecialties, setLoadingSpecialties] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        project_id: fixedProjectId || '',
        role_id: roleOptions[0].value,
        functional_role_id: '',
        job_title: '',
        primary_specialty_id: ''
    })

    useEffect(() => {
        if (fixedProjectId) {
            setFormData(prev => ({ ...prev, project_id: fixedProjectId }))
        }
    }, [fixedProjectId])

    useEffect(() => {
        async function loadFunctionalRoles() {
            setLoadingRoles(true)
            const result = await getCompanyRoles(companyId)
            if (result.success && result.data) {
                const allowedBaseRoles = roleOptions.map(r => r.value)
                const filteredRoles = result.data.filter(role =>
                    allowedBaseRoles.includes(role.base_role)
                )
                setFunctionalRoles(filteredRoles)
            }
            setLoadingRoles(false)
        }
        loadFunctionalRoles()
    }, [companyId, roleOptions])

    useEffect(() => {
        async function loadSpecialties() {
            setLoadingSpecialties(true)
            if (formData.project_id) {
                const specs = await getProjectSpecialties(formData.project_id)
                setAvailableSpecialties(specs)
            } else {
                const specs = await getAllSpecialties()
                setAvailableSpecialties(specs)
            }
            setLoadingSpecialties(false)
        }
        loadSpecialties()
    }, [formData.project_id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (requireProject && !formData.project_id) {
            setError('Debes seleccionar un proyecto')
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccess(false)

        try {
            const result = await onInvite({
                email: formData.email,
                role_id: formData.role_id,
                project_id: formData.project_id || undefined,
                functional_role_id: formData.functional_role_id || undefined,
                job_title: formData.job_title,
                primary_specialty_id: formData.primary_specialty_id || undefined
            })

            if (result.success && result.data) {
                setSuccess(true)
                setInvitationLink(result.data.link)
                setFormData(prev => ({ ...prev, email: '', job_title: '' }))

                if (invitations.length === 0) {
                    setShowConfetti(true)
                    setToastMessage(CELEBRATION_MESSAGES.invitations)
                    setTimeout(() => setShowConfetti(false), 5000)
                } else {
                    setToastMessage('Invitación enviada correctamente')
                }

                window.dispatchEvent(new Event('onboarding-updated'))
            } else {
                setError(result.message || 'Error al crear invitación')
            }
        } catch (err) {
            setError('Error inesperado al procesar la solicitud')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function copyToClipboard() {
        await navigator.clipboard.writeText(invitationLink)
        setToastMessage('Link copiado al portapapeles')
    }

    const waMessage = (() => {
        const contextName = fixedProjectId
            ? projects.find(p => p.id === fixedProjectId)?.name
            : (formData.project_id
                ? projects.find(p => p.id === formData.project_id)?.name
                : companyName || 'nuestro equipo')

        return `🚀 Hola! Te estoy invitando a colaborar en *${contextName}* usando LukeAPP.\n\nPara aceptar la invitación y crear tu cuenta, entra aquí:\n👉 ${invitationLink}`
    })()

    const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in p-1">
            {/* LEFT COLUMN: FORM */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group/form">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover/form:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform group-hover/form:rotate-3 transition-transform">
                            <UserPlus size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight tracking-tight">Nueva Invitación</h2>
                            <p className="text-slate-400 text-sm font-medium">
                                {requireProject
                                    ? 'Genera un acceso seguro para un nuevo administrador.'
                                    : 'Genera un acceso para un miembro de la organización.'}
                            </p>
                        </div>
                    </div>

                    {success && invitationLink ? (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                        <CheckCircle2 size={32} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-emerald-400 font-black text-xl mb-1 tracking-tight">¡INVITACIÓN LISTA!</h3>
                                    <p className="text-emerald-400/70 text-sm font-medium">El enlace de acceso ya puede ser compartido.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2 p-2 bg-slate-950/60 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all shadow-inner">
                                    <input
                                        type="text"
                                        readOnly
                                        value={invitationLink}
                                        className="flex-1 bg-transparent border-none text-emerald-400 font-mono text-sm px-4 focus:ring-0"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 px-5 font-bold text-xs"
                                    >
                                        <Copy size={18} />
                                        COPIAR
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#20bd5c] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-500/10 active:scale-95"
                                    >
                                        <MessageCircle size={18} /> WhatsApp
                                    </a>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent('Invitación a LukeAPP')}&body=${encodeURIComponent(`Hola,\n\nTe han invitado a unirte.\n\nPuedes registrarte aquí:\n${invitationLink}`)}`}
                                        className="flex items-center justify-center gap-2 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                    >
                                        <Mail size={18} /> Email
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={() => { setSuccess(false); setInvitationLink('') }}
                                className="w-full py-4 text-slate-500 hover:text-white font-bold text-sm transition-colors border-t border-white/5 pt-6 flex items-center justify-center gap-2 group/back"
                            >
                                <Icons.Refresh size={16} className="group-hover/back:rotate-90 transition-transform" />
                                Crear otra invitación
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
                                    <Icons.Warning size={20} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email del Usuario</label>
                                <Input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:bg-slate-950 transition-all font-medium text-white placeholder:text-slate-700"
                                    placeholder="usuario@empresa.com"
                                />
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex justify-between">
                                    <span>Rol Funcional</span>
                                    {formData.functional_role_id && <span className="text-blue-400 flex items-center gap-1"><Icons.Check size={12} /> Sincronizado</span>}
                                </label>
                                <div className="relative">
                                    {loadingRoles ? (
                                        <div className="h-14 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center px-4 animate-pulse italic text-slate-600 text-sm">
                                            Consultando catálogo de roles...
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.functional_role_id}
                                            onChange={(e) => {
                                                const selectedRoleId = e.target.value
                                                const selectedRole = functionalRoles.find(r => r.id === selectedRoleId)
                                                if (selectedRole) {
                                                    setFormData({
                                                        ...formData,
                                                        functional_role_id: selectedRoleId,
                                                        role_id: selectedRole.base_role,
                                                        job_title: selectedRole.name
                                                    })
                                                } else {
                                                    setFormData({ ...formData, functional_role_id: '', job_title: '' })
                                                }
                                            }}
                                            className="w-full h-14 bg-slate-950/50 border border-white/5 rounded-2xl px-5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all appearance-none text-sm font-bold cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-950 font-sans">Seleccionar rol predifinido</option>
                                            {functionalRoles.map(role => (
                                                <option key={role.id} value={role.id} className="bg-slate-950 font-sans py-2">
                                                    {role.name}
                                                </option>
                                            ))}
                                            <option value="" className="bg-slate-950 text-amber-500 font-black">-- Rol Personalizado --</option>
                                        </select>
                                    )}
                                </div>
                                {formData.functional_role_id ? (() => {
                                    const selected = functionalRoles.find(r => r.id === formData.functional_role_id)
                                    if (!selected) return null
                                    return (
                                        <div className="mt-3 text-[11px] leading-relaxed font-medium flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-top-1">
                                            <div className="w-2 h-2 rounded-full mt-1 shrink-0 shadow-sm" style={{ background: selected.color }} />
                                            <span style={{ color: selected.color }} className="opacity-90">{selected.description}</span>
                                        </div>
                                    )
                                })() : (
                                    <div className="mt-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                                        <Icons.Warning size={18} className="text-amber-500 shrink-0" />
                                        <p className="text-[11px] text-amber-500/70 font-medium">No hay roles funcionales definidos. El usuario se creará con permisos básicos.</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Permisos</label>
                                    {functionalRoles.length > 0 && formData.functional_role_id ? (
                                        <div className="h-14 bg-slate-950/30 border border-white/5 rounded-2xl px-5 flex items-center justify-between text-slate-500 text-sm font-bold shadow-inner">
                                            {roleOptions.find(r => r.value === formData.role_id)?.label}
                                            <Shield size={16} className="text-indigo-500 opacity-50" />
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.role_id}
                                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                            className="w-full h-14 bg-slate-950/50 border border-white/5 rounded-2xl px-5 text-white text-sm font-bold appearance-none cursor-pointer focus:border-blue-500/40 transition-all font-sans"
                                        >
                                            {roleOptions.map(role => (
                                                <option key={role.value} value={role.value} className="bg-slate-950">{role.label}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Cargo</label>
                                    <Input
                                        type="text"
                                        value={formData.job_title}
                                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        className="bg-slate-950/50 border-white/5 h-14 rounded-2xl font-medium focus:bg-slate-950"
                                        placeholder="Ej: Jefe de Spooling"
                                    />
                                </div>
                            </div>

                            {requireProject && (
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Proyecto Asignado</label>
                                    {fixedProjectId ? (
                                        <div className="h-14 bg-slate-950/30 border border-white/5 rounded-2xl px-5 flex items-center justify-between text-slate-500 text-sm font-bold italic shadow-inner">
                                            {projects.find(p => p.id === fixedProjectId)?.name || 'Proyecto Actual'}
                                            <div className="flex items-center gap-2 opacity-40">
                                                <span className="text-[9px] uppercase tracking-tighter">Bloqueado</span>
                                                <Shield size={14} className="text-amber-500" />
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            required={requireProject}
                                            value={formData.project_id}
                                            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                            className="w-full h-14 bg-slate-950/50 border border-white/5 rounded-2xl px-5 text-white text-sm font-bold appearance-none cursor-pointer font-sans"
                                        >
                                            <option value="" className="bg-slate-950">Seleccionar proyecto destinatario</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id} className="bg-slate-950">{p.name} ({p.code})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Primary Specialty Selection */}
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Contexto de Especialidad</label>
                                <div className="relative">
                                    <select
                                        value={formData.primary_specialty_id}
                                        onChange={(e) => setFormData({ ...formData, primary_specialty_id: e.target.value })}
                                        className="w-full h-14 bg-slate-950/50 border border-white/5 rounded-2xl px-5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all appearance-none text-sm font-bold cursor-pointer font-sans"
                                    >
                                        <option value="" className="bg-slate-950">Especialidad: TODAS (Acceso Global)</option>
                                        {availableSpecialties.map(spec => (
                                            <option key={spec.id} value={spec.id} className="bg-slate-950">
                                                {spec.name} ({spec.code})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                        <Shield size={16} className="text-blue-400" />
                                    </div>
                                </div>
                                <Text size="xs" className="text-slate-600 ml-2 italic">
                                    Define la especialidad principal para el onboarding del usuario.
                                </Text>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 font-extrabold text-white rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all transform flex items-center justify-center gap-3 mt-4"
                            >
                                {isSubmitting ? (
                                    <Icons.Refresh size={24} className="animate-spin" />
                                ) : (
                                    <QrCode size={24} />
                                )}
                                <span className="tracking-[0.1em] uppercase text-sm">
                                    {isSubmitting ? 'GENERANDO LINK...' : 'GENERAR LINK DE INVITACIÓN'}
                                </span>
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: LIST */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col min-h-[600px] overflow-hidden group/list relative">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover/list:opacity-100 transition-opacity duration-1000" />

                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <Mail size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-black text-white tracking-tight uppercase">Auditoría de Invitaciones</h2>
                        </div>
                        {invitations.length > 0 && (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20">
                                {invitations.length} PENDIENTES
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-xs font-medium italic">Monitor de enlaces emitidos y estado de aceptación.</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[650px] scrollbar-hide">
                    {invitations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                            <div className="w-20 h-20 bg-slate-800/30 rounded-3xl flex items-center justify-center mb-6 border border-white/5 opacity-40 transform rotate-6">
                                <Mail size={40} className="text-slate-500" />
                            </div>
                            <h3 className="text-slate-400 font-bold mb-2 tracking-tight">SILENCIO TOTAL</h3>
                            <p className="text-slate-600 text-xs leading-relaxed max-w-[200px] mx-auto uppercase tracking-tighter">
                                No hay invitaciones activas en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-left">
                                    <tr>
                                        <th className="px-8 py-5 border-b border-white/5">Candidato / Emisión</th>
                                        <th className="px-8 py-5 border-b border-white/5">Contexto / Especialidad</th>
                                        <th className="px-8 py-5 border-b border-white/5 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {invitations.map((inv) => (
                                        <tr key={inv.id} className="group/row hover:bg-blue-500/5 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-white group-hover/row:text-blue-400 transition-colors tracking-tight">{inv.email}</div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold opacity-60">EMITIDO:</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{new Date(inv.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest leading-none">
                                                            {roleOptions.find(r => r.value === inv.role_id)?.label || inv.role_id}
                                                        </span>
                                                        {(() => {
                                                            const spec = availableSpecialties.find(s => s.id === inv.primary_specialty_id)
                                                            return (
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest leading-none ${spec ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                                                                    {spec ? spec.code : 'TODAS'}
                                                                </span>
                                                            )
                                                        })()}
                                                    </div>
                                                    {!requireProject && (inv as any).project && (
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg w-fit">
                                                            <Icons.Project size={10} className="text-slate-500" />
                                                            <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                                                                {(inv as any).project.code}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex gap-2 justify-end opacity-40 group-hover/row:opacity-100 transition-opacity translate-x-2 group-hover/row:translate-x-0">
                                                    <button
                                                        onClick={async () => {
                                                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                                                            const link = `${baseUrl}/invitations/accept/${inv.token}`
                                                            await navigator.clipboard.writeText(link)
                                                            setToastMessage('Link de registro capturado')
                                                        }}
                                                        className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10 hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95"
                                                        title="Copiar link"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onRevoke(inv.id)}
                                                        className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                                                        title="Revocar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

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
