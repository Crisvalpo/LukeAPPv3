'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectById, updateProject, deleteProject, type Project } from '@/services/projects'
import { getPendingInvitations, createInvitation, revokeInvitation, type Invitation } from '@/services/invitations'
import { ArrowLeft, Building2, Calendar, FileText, Check, X, Shield, Users, Trash2 } from 'lucide-react'
import EngineeringManager from '@/components/engineering/EngineeringManager'
import ProcurementManager from '@/components/procurement/ProcurementManager'

// ... imports ...

export default function ProjectDetailPage() {
    // ... setup ...
    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'engineering' | 'procurement'>('details')

    // ... loadProject ...

    return (
        <div className="dashboard-page">
            {/* ... header ... */}

            {isEditing ? (
                // ... edit form ...
            ): (
                    <div>
                        {/* Tabs Navigation */ }
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('details')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'details' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'details' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'details' ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Detalles
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'team' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'team' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'team' ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Equipo & Invitaciones
                </button>
                <button
                    onClick={() => setActiveTab('engineering')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'engineering' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'engineering' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'engineering' ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Ingeniería
                </button>
                <button
                    onClick={() => setActiveTab('procurement')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'procurement' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'procurement' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'procurement' ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Abastecimiento
                </button>
            </div>

            {activeTab === 'details' && (
                <div style={{ padding: '1rem' }} className="fade-in">
                    {/* ... Details Content ... */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Cliente
                            </h3>
                            <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500' }}>
                                {project.client_name || <span style={{ color: '#475569', fontStyle: 'italic' }}>No especificado</span>}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Contrato
                            </h3>
                            <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500', fontFamily: 'monospace' }}>
                                {project.contract_number || <span style={{ color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>No especificado</span>}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Descripción
                            </h3>
                            <div style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                {project.description || <span style={{ color: '#475569', fontStyle: 'italic' }}>Sin descripción</span>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="action-button"
                            style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                        >
                            <FileText size={18} />
                            Editar Proyecto
                        </button>

                        <button
                            onClick={handleDelete}
                            className="action-button delete"
                            style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                        >
                            <Trash2 size={18} />
                            Eliminar
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="fade-in">
                    <InvitationManager
                        companyId={project.company_id}
                        companyName="Este Proyecto"
                        projects={[project]}
                        invitations={invitations}
                        requireProject={true}
                        fixedProjectId={project.id}
                        onInvite={handleInvite}
                        onRevoke={handleRevoke}
                        roleOptions={[
                            { value: 'admin', label: 'Admin Proyecto', description: 'Control total de ingeniería y construcción.' },
                            { value: 'supervisor', label: 'Supervisor', description: 'Gestión de terreno, bodega o calidad.' },
                            { value: 'worker', label: 'Operativo', description: 'Visualización de tareas y reportes simples.' }
                        ]}
                    />
                </div>
            )}

            {activeTab === 'engineering' && (
                <div className="fade-in">
                    <EngineeringManager
                        projectId={project.id}
                        companyId={project.company_id}
                    />
                </div>
            )}

            {activeTab === 'procurement' && (
                <div className="fade-in">
                    <ProcurementManager
                        projectId={project.id}
                        companyId={project.company_id}
                    />
                </div>
            )}
        </div>
    )
}
            </div >
        </div >
    )
}
