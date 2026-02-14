/**
 * ENGINEERING DETAILS TAB - WELDS-FIRST PATTERN
 * 
 * Simplified tab structure:
 * - Only Welds tab (Spools auto-generated)
 * - MTO and Bolted Joints as placeholders
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RevisionSelector from './RevisionSelector'
import DetailUploader from './DetailUploader'
import MTOUploader from './MTOUploader'
import JointsUploader from './JointsUploader'
import { downloadWeldsTemplate, downloadMTOTemplate, downloadJointsTemplate } from '@/lib/utils/template-generator'
import { getMTOCount } from '@/services/mto'
import { getJointsCount } from '@/services/joints'
import { Wrench, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

interface Props {
    projectId: string
    companyId: string
}

export default function EngineeringDetailsTab({ projectId, companyId }: Props) {
    const [selectedContext, setSelectedContext] = useState<{
        isoId: string,
        revId: string,
        isoNumber: string
    } | null>(null)

    const [activeTab, setActiveTab] = useState<'welds' | 'mto' | 'joints'>('welds')
    const [counts, setCounts] = useState<{ welds: number, spools: number, mto: number, joints: number } | null>(null)
    const [requiresJoints, setRequiresJoints] = useState<boolean | null>(null)

    // Fetch counts and config when context changes
    const handleContextChange = async (context: { isoId: string, revId: string, isoNumber: string }) => {
        setSelectedContext(context)
        setCounts(null)
        setRequiresJoints(null)

        if (!context.revId) return

        const supabase = createClient()

        try {
            // Fetch Revision Config
            const { data: revData } = await supabase
                .from('engineering_revisions')
                .select('requires_joints')
                .eq('id', context.revId)
                .single()

            if (revData) {
                setRequiresJoints(revData.requires_joints)
            }

            // Count Welds
            const { count: weldsCount } = await supabase
                .from('spools_welds')
                .select('*', { count: 'exact', head: true })
                .eq('revision_id', context.revId)

            // Count Spools
            const { data: spools } = await supabase
                .from('spools_welds')
                .select('spool_number')
                .eq('revision_id', context.revId)

            const uniqueSpools = new Set(spools?.map(s => s.spool_number))

            // Count MTO & Joints (Parallel)
            const [mtoCount, jointsCount] = await Promise.all([
                getMTOCount(context.revId).catch(() => 0),
                getJointsCount(context.revId).catch(() => 0)
            ])

            setCounts({
                welds: weldsCount || 0,
                spools: uniqueSpools.size,
                mto: mtoCount,
                joints: jointsCount
            })
        } catch (error) {
            console.error('Error fetching detail counts:', error)
        }
    }

    const getOpacity = (count: number, isJoints: boolean = false) => {
        if (count > 0) return 1
        if (isJoints && requiresJoints === false) return 1
        return 0.4
    }

    // Update toggle
    const updateRequiresJoints = async (required: boolean) => {
        if (!selectedContext?.revId) return

        const supabase = createClient()
        const { error } = await supabase
            .from('engineering_revisions')
            .update({ requires_joints: required })
            .eq('id', selectedContext.revId)

        if (!error) {
            setRequiresJoints(required)
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-lg space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <Heading title="Carga de Detalles" size="lg" className="mb-1" />
                        <p className="text-text-dim text-sm">
                            Carga el mapa de uniones. Los spools se generarán automáticamente.
                        </p>
                    </div>
                </div>

                <RevisionSelector
                    projectId={projectId}
                    onRevisionSelect={(isoId, revId, isoNumber) =>
                        handleContextChange({ isoId, revId, isoNumber })
                    }
                />

                {selectedContext ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
                            <div className="text-sm text-text-dim">
                                Trabajando en: <strong className="text-brand-primary text-base ml-1">{selectedContext.isoNumber}</strong> (Revisión Seleccionada)
                            </div>

                            {counts && (counts.welds > 0 || counts.spools > 0 || counts.mto > 0 || counts.joints > 0) && (
                                <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-black/40 px-6 py-3 rounded-full border border-glass-border/30 shadow-inner">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-bold text-white leading-none">{counts.welds}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mt-1">Uniones</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-bold text-white leading-none">{counts.spools}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mt-1">Spools</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col items-center" style={{ opacity: getOpacity(counts.mto) }}>
                                        <span className="text-xl font-bold text-white leading-none">{counts.mto}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mt-1">MTO</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col items-center" style={{ opacity: getOpacity(counts.joints, true) }}>
                                        <span className="text-xl font-bold text-white leading-none">{counts.joints}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mt-1">Juntas</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 md:hidden" />
                                    <div className="ml-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                                        <CheckCircle2 size={12} /> Datos cargados
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex border-b border-glass-border/30">
                            <button
                                className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'welds'
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-text-dim hover:text-white hover:bg-white/5'
                                    }`}
                                onClick={() => setActiveTab('welds')}
                            >
                                🔥 Uniones
                            </button>
                            <button
                                className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'mto'
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-text-dim hover:text-white hover:bg-white/5'
                                    }`}
                                onClick={() => setActiveTab('mto')}
                            >
                                📦 MTO
                            </button>
                            <button
                                className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'joints'
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-text-dim hover:text-white hover:bg-white/5'
                                    }`}
                                onClick={() => setActiveTab('joints')}
                            >
                                🔧 Juntas
                            </button>
                            <button className="px-6 py-3 text-sm font-semibold text-text-dim/40 cursor-not-allowed hidden md:block">🏗️ Soportes</button>
                            <button className="px-6 py-3 text-sm font-semibold text-text-dim/40 cursor-not-allowed hidden md:block">STOP Válvulas</button>
                        </div>

                        <div className="min-h-[300px]">
                            {activeTab === 'welds' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-text-dim text-sm">
                                            <strong>Mapa de Uniones:</strong> Los spools se generan automáticamente agrupando por SPOOL NUMBER.
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={downloadWeldsTemplate}
                                            className="gap-2 text-brand-secondary hover:text-brand-secondary hover:bg-brand-secondary/10"
                                        >
                                            <Download size={14} /> Descargar Plantilla
                                        </Button>
                                    </div>
                                    <DetailUploader
                                        revisionId={selectedContext.revId}
                                        projectId={projectId}
                                        companyId={companyId}
                                    />
                                </div>
                            )}

                            {activeTab === 'mto' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-text-dim text-sm">
                                            <strong>Material Take-Off:</strong> Cargar lista de materiales desde Excel (MTO).
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={downloadMTOTemplate}
                                            className="gap-2 text-brand-secondary hover:text-brand-secondary hover:bg-brand-secondary/10"
                                        >
                                            <Download size={14} /> Descargar Plantilla
                                        </Button>
                                    </div>
                                    <MTOUploader
                                        revisionId={selectedContext.revId}
                                        projectId={projectId}
                                        companyId={companyId}
                                    />
                                </div>
                            )}

                            {activeTab === 'joints' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-text-dim text-sm">
                                            <strong>Juntas Apernadas:</strong> Cargar reporte de juntas (Bolted Joints).
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={downloadJointsTemplate}
                                            className="gap-2 text-brand-secondary hover:text-brand-secondary hover:bg-brand-secondary/10"
                                        >
                                            <Download size={14} /> Descargar Plantilla
                                        </Button>
                                    </div>

                                    {counts?.joints === 0 && (
                                        <div className="bg-bg-surface-1/50 border border-glass-border/30 rounded-xl p-4 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-white font-medium mb-1">¿Esta revisión requiere Uniones Apernadas?</p>
                                                {requiresJoints === false && (
                                                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Marcado como "No Aplica"
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateRequiresJoints(true)}
                                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${requiresJoints === true
                                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                                            : 'bg-white/5 text-text-dim hover:bg-white/10'
                                                        }`}
                                                >
                                                    SI
                                                </button>
                                                <button
                                                    onClick={() => updateRequiresJoints(false)}
                                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${requiresJoints === false
                                                            ? 'bg-status-success text-white shadow-lg shadow-status-success/20'
                                                            : 'bg-white/5 text-text-dim hover:bg-white/10'
                                                        }`}
                                                >
                                                    NO
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <JointsUploader
                                        revisionId={selectedContext.revId}
                                        projectId={projectId}
                                        companyId={companyId}
                                    />
                                </div>
                            )}
                        </div>
                    </div >
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-glass-border/30 rounded-2xl bg-white/5 text-text-dim">
                        <div className="w-16 h-16 rounded-full bg-bg-surface-2 flex items-center justify-center mb-4 text-3xl shadow-inner">
                            👆
                        </div>
                        <p className="font-medium">Selecciona un isométrico y revisión arriba para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    )
}
