/**
 * Procurement Hub Page
 * Central hub for Material Control: Requests (MIR/PO) -> Receiving -> Inventory
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
// Styles migrated to Tailwind v4

// Components
import { Heading, Text } from '@/components/ui/Typography'
import MaterialRequestList from '@/components/procurement/MaterialRequestList'
import CreateRequestModal from '@/components/procurement/CreateRequestModal'
import ConsolidatedMTO from '@/components/procurement/ConsolidatedMTO'
import PipeInventoryMaster from '@/components/procurement/PipeInventoryMaster'
import ProjectMaterialsManager from '@/components/procurement/ProjectMaterialsManager'
import SpoolIdentificationDashboard from '@/components/procurement/SpoolIdentificationDashboard'
import MaterialInventoryDashboard from '@/components/procurement/MaterialInventoryDashboard'

import {
    ClipboardList,
    BarChart3,
    Inbox,
    Package,
    Book,
    Ruler,
    Layers,
    Search,
    ChevronDown,
    Plus
} from 'lucide-react'

export default function ProcurementPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [activeTab, setActiveTab] = useState('requests')
    const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string; company_id: string }>>([])
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [userRole, setUserRole] = useState<'founder' | 'admin' | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        loadProjects()
        const tab = searchParams?.get('tab')
        if (tab && ['requests', 'mto', 'receiving', 'inventory', 'pipe-manager', 'catalog'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    async function loadProjects() {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            const { data: memberData } = await supabase
                .from('members')
                .select('company_id, project_id, role_id')
                .eq('user_id', user.id)
                .in('role_id', ['founder', 'admin'])
                .single()

            if (!memberData) return

            setUserRole(memberData.role_id as 'founder' | 'admin')

            if (memberData.role_id === 'founder') {
                const { data: companyProjects } = await supabase
                    .from('projects')
                    .select('id, name, code, company_id')
                    .eq('company_id', memberData.company_id)
                    .order('name')

                if (companyProjects?.length) {
                    setProjects(companyProjects)
                    setSelectedProject(companyProjects[0].id)
                }
            } else if (memberData.role_id === 'admin' && memberData.project_id) {
                const { data: project } = await supabase
                    .from('projects')
                    .select('id, name, code, company_id')
                    .eq('id', memberData.project_id)
                    .single()

                if (project) {
                    setProjects([project])
                    setSelectedProject(project.id)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    function handleTabChange(tab: string) {
        if (!selectedProject) return
        setActiveTab(tab)
        const params = new URLSearchParams(searchParams?.toString())
        params.set('tab', tab)
        router.push(`/founder/procurement?${params.toString()}`)
    }

    function getSelectedCompanyId() {
        if (!selectedProject || projects.length === 0) return ''
        return projects.find(p => p.id === selectedProject)?.company_id || ''
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="tracking-tight text-white">Gestión de Materiales</Heading>
                    </div>
                    <Text size="base" className="text-text-muted font-medium ml-4.5">
                        Control de Abastecimiento: Solicitudes, Recepción e Inventario
                    </Text>
                </div>

                {/* Project Selector - Reused styling from engineering */}
                {userRole === 'founder' && projects.length > 0 && (
                    <div className="engineering-project-selector" style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Proyecto:</span>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="project-dropdown"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                outline: 'none'
                            }}
                        >
                            {projects.map(project => (
                                <option key={project.id} value={project.id} style={{ color: 'black' }}>
                                    {project.code} - {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {activeTab === 'requests' && selectedProject && (
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Solicitud
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Horizontal Navigation */}
            <div className="flex gap-2 p-1.5 mb-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-x-auto scrollbar-hide">
                {[
                    { id: 'requests', label: 'Solicitudes', icon: <ClipboardList className="w-4 h-4" /> },
                    { id: 'mto', label: 'Consolidado (MTO)', icon: <BarChart3 className="w-4 h-4" /> },
                    { id: 'spools', label: 'Spools', icon: <Layers className="w-4 h-4" /> },
                    { id: 'inventory', label: 'Inventario', icon: <Package className="w-4 h-4" /> },
                    { id: 'catalog', label: 'Catálogo Maestro', icon: <Book className="w-4 h-4" /> },
                    { id: 'receiving', label: 'Recepción', icon: <Inbox className="w-4 h-4" /> },
                    { id: 'pipe-manager', label: 'Cañerías', icon: <Ruler className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {!selectedProject ? (
                    <div className="coming-soon-placeholder">
                        <p>Selecciona un proyecto para ver los materiales.</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'requests' && (
                            <MaterialRequestList projectId={selectedProject} />
                        )}

                        {activeTab === 'mto' && (
                            <ConsolidatedMTO projectId={selectedProject} companyId={getSelectedCompanyId()} />
                        )}

                        {activeTab === 'receiving' && (
                            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center">
                                <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <Heading level={3} className="text-white">Módulo de Recepción</Heading>
                                <Text className="text-slate-500">Próximamente: Ingreso de guías de despacho y control físico.</Text>
                            </div>
                        )}

                        {activeTab === 'catalog' && (
                            <ProjectMaterialsManager projectId={selectedProject} />
                        )}

                        {activeTab === 'spools' && (
                            <SpoolIdentificationDashboard projectId={selectedProject} />
                        )}

                        {activeTab === 'inventory' && (
                            <MaterialInventoryDashboard projectId={selectedProject} />
                        )}

                        {activeTab === 'pipe-manager' && (
                            <PipeInventoryMaster projectId={selectedProject} companyId={getSelectedCompanyId()} />
                        )}
                    </>
                )}
            </div>

            {showCreateModal && selectedProject && (
                <CreateRequestModal
                    projectId={selectedProject}
                    companyId={getSelectedCompanyId()}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        // Reload mechanism (could be better)
                        window.location.reload()
                    }}
                />
            )}

            <style jsx>{`
                .coming-soon-placeholder {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 0.5rem;
                    color: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    )
}
