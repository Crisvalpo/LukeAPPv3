/**
 * ENGINEERING DETAILS TAB - WELDS-FIRST PATTERN
 * 
 * Simplified tab structure:
 * - Only Welds tab (Spools auto-generated)
 * - MTO and Bolted Joints as placeholders
 */

'use client'

import { useState } from 'react'
import RevisionSelector from './RevisionSelector'
import DetailUploader from './DetailUploader'
import { downloadWeldsTemplate } from '@/lib/utils/template-generator'

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
                    setSelectedContext({ isoId, revId, isoNumber })
                }
            />

            {selectedContext ? (
                <div className="details-workspace animate-fade-in">
                    <div className="context-banner">
                        Trabajando en: <strong>{selectedContext.isoNumber}</strong> (Revisión Seleccionada)
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
                                <div className="section-info">
                                    <p><strong>Mapa de Soldaduras:</strong> Los spools se generan automáticamente agrupando por SPOOL NUMBER.</p>
                                    <button className="btn-text" onClick={downloadWeldsTemplate}>
                                        📥 Descargar Plantilla Welds
                                    </button>
                                </div>
                                <DetailUploader
                                    revisionId={selectedContext.revId}
                                    projectId={projectId}
                                    companyId={companyId}
                                />
                            </div>
                        )}

                        {(activeTab === 'mto' || activeTab === 'joints') && (
                            <div className="coming-soon">
                                🚧 Próximamente disponible
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
                
                .context-banner {
                    background: rgba(var(--accent-rgb), 0.1);
                    color: var(--accent);
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    border: 1px solid rgba(var(--accent-rgb), 0.2);
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
            `}</style>
        </div>
    )
}
