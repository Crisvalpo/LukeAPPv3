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
import '@/styles/engineering-details.css'

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
    const [counts, setCounts] = useState<{ welds: number, spools: number } | null>(null)

    // Fetch counts when context changes
    const handleContextChange = async (context: { isoId: string, revId: string, isoNumber: string }) => {
        setSelectedContext(context)
        setCounts(null) // Reset while loading

        if (!context.revId) return

        const supabase = createClient()

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

        setCounts({
            welds: weldsCount || 0,
            spools: uniqueSpools.size
        })
    }

    return (
        <div className="details-tab-container">
            <div className="section-header">
                <div className="icon">🔩</div>
                <div>
                    <h3>2. Carga de Detalles</h3>
                    <p>Carga el mapa de soldaduras. Los spools se generarán automáticamente.</p>
                </div>
            </div>

            <RevisionSelector
                projectId={projectId}
                onRevisionSelect={(isoId, revId, isoNumber) =>
                    handleContextChange({ isoId, revId, isoNumber })
                }
            />

            {selectedContext ? (
                <div className="details-workspace animate-fade-in">
                    <div className="context-header">
                        <div className="context-banner">
                            Trabajando en: <strong>{selectedContext.isoNumber}</strong> (Revisión Seleccionada)
                        </div>

                        {counts && (counts.welds > 0 || counts.spools > 0) && (
                            <div className="eng-data-summary-card">
                                <div className="eng-summary-item">
                                    <span className="icon">🔥</span>
                                    <span className="count">{counts.welds}</span>
                                    <span className="label">Soldaduras</span>
                                </div>
                                <div className="eng-divider"></div>
                                <div className="eng-summary-item">
                                    <span className="icon">📦</span>
                                    <span className="count">{counts.spools}</span>
                                    <span className="label">Spools</span>
                                </div>
                                <div className="eng-status-indicator">
                                    ✅ Datos ya cargados
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="tabs-nav">
                        <button
                            className={activeTab === 'welds' ? 'active' : ''}
                            onClick={() => setActiveTab('welds')}
                        >
                            🔥 Soldaduras (Welds)
                        </button>
                        <button
                            className={activeTab === 'mto' ? 'active' : ''}
                            onClick={() => setActiveTab('mto')}
                        >
                            📦 MTO
                        </button>
                        <button
                            className={activeTab === 'joints' ? 'active' : ''}
                            onClick={() => setActiveTab('joints')}
                        >
                            🔧 Juntas
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'welds' && (
                            <div className="detail-section">
                                <p className="tab-description">
                                    <strong>Mapa de Soldaduras:</strong> Los spools se generan automáticamente agrupando por SPOOL NUMBER.
                                    <button className="btn-link" onClick={downloadWeldsTemplate}>📥 Descargar Plantilla</button>
                                </p>
                                <DetailUploader
                                    revisionId={selectedContext.revId}
                                    projectId={projectId}
                                    companyId={companyId}
                                />
                            </div>
                        )}

                        {activeTab === 'mto' && (
                            <div className="detail-section">
                                <p className="tab-description">
                                    <strong>Material Take-Off:</strong> Cargar lista de materiales desde Excel (MTO).
                                    <button className="btn-link" onClick={downloadMTOTemplate}>📥 Descargar Plantilla</button>
                                </p>
                                <MTOUploader
                                    revisionId={selectedContext.revId}
                                    projectId={projectId}
                                    companyId={companyId}
                                />
                            </div>
                        )}

                        {activeTab === 'joints' && (
                            <div className="detail-section">
                                <p className="tab-description">
                                    <strong>Juntas Apernadas:</strong> Cargar reporte de juntas (Bolted Joints).
                                    <button className="btn-link" onClick={downloadJointsTemplate}>📥 Descargar Plantilla</button>
                                </p>
                                <JointsUploader
                                    revisionId={selectedContext.revId}
                                    projectId={projectId}
                                    companyId={companyId}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="placeholder-state">
                    👆 Selecciona un isométrico y revisión arriba para comenzar
                </div>
            )}

            <style jsx>{`
                .details-tab-container { animation: fadeIn 0.3s ease; }
                .section-header { display: flex; gap: 15px; margin-bottom: 25px; align-items: center; }
                .section-header .icon { font-size: 2rem; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; }
                
                .context-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .context-banner {
                    background: rgba(var(--accent-rgb), 0.1);
                    color: var(--accent);
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    border: 1px solid rgba(var(--accent-rgb), 0.2);
                    flex-grow: 1;
                }

                .eng-data-summary-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: #1e1e1e; /* Explicit dark background */
                    border: 1px solid #333;
                    padding: 10px 25px;
                    border-radius: 12px;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
                }

                .eng-summary-item {
                    display: flex;
                    flex-direction: column; /* Vertical layout based on screenshot hint */
                    align-items: center;
                    gap: 4px;
                    min-width: 80px;
                }

                .eng-summary-item .icon {
                    font-size: 1.2rem;
                    margin-bottom: 2px;
                }

                .eng-summary-item .count {
                    font-weight: 800;
                    font-size: 1.4rem;
                    color: #fff; /* White should pop on #1e1e1e */
                    line-height: 1;
                }

                .eng-summary-item .label {
                    color: #aaa;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .eng-divider {
                    width: 1px;
                    height: 30px;
                    background: rgba(255,255,255,0.1);
                }

                .eng-status-indicator {
                    color: #10b981;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-left: 10px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 4px 10px;
                    border-radius: 20px;
                }

                .tabs-nav {
                    display: flex; gap: 2px; margin-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .tabs-nav button {
                    background: transparent; border: none; color: #888;
                    padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent;
                    transition: all 0.2s; font-weight: 500;
                }
                .tabs-nav button:hover { color: #fff; background: rgba(255,255,255,0.02); }
                .tabs-nav button.active { color: var(--accent); border-bottom-color: var(--accent); }

                .placeholder-state {
                    text-align: center; padding: 40px; color: #666;
                    border: 2px dashed rgba(255,255,255,0.05); border-radius: 12px;
                }
                .btn-text { background: none; border: none; color: var(--accent); text-decoration: underline; cursor: pointer; }
                .section-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .coming-soon { text-align: center; padding: 40px; font-size: 1.2rem; color: #666; }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
