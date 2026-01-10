'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCompanyRolesWithStats, cloneStandardRoles, deleteRole } from '@/services/roles';
import type { CompanyRoleWithStats } from '@/types';
import RoleEditorModal from '@/components/roles/RoleEditorModal';
import {
    Lightbulb,
    Users,
    Package,
    Pencil,
    Trash2,
    Plus,
    ClipboardList,
    CheckCircle2
} from 'lucide-react';
import '@/styles/roles.css';

import { createClient } from '@/lib/supabase/client';

export default function RolesManagementPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<CompanyRoleWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<CompanyRoleWithStats | null>(null);

    useEffect(() => {
        loadCompanyContext();
    }, []);

    async function loadCompanyContext() {
        try {
            const supabase = createClient();

            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // 2. Get company_id from membership
            // We look for a founder role to ensure security, though RLS handles it too
            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('company_id')
                .eq('user_id', user.id)
                .in('role_id', ['founder', 'admin']) // Allow admins too just in case
                .limit(1)
                .maybeSingle();

            if (memberError || !member) {
                setError('No se encontró una empresa asociada a tu cuenta.');
                setIsLoading(false);
                return;
            }

            const realCompanyId = member.company_id;
            setCompanyId(realCompanyId);
            await loadRoles(realCompanyId); // Load roles with REAL ID

        } catch (error) {
            console.error('Error loading company context:', error);
            setError('Error al cargar el contexto de la empresa');
            setIsLoading(false);
        }
    }

    async function loadRoles(companyId: string) {
        setIsLoading(true);
        const result = await getCompanyRolesWithStats(companyId);

        if (result.success) {
            setRoles(result.data || []);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    }

    async function handleCloneStandardRoles() {
        if (!companyId) return;

        setIsCloning(true);
        const result = await cloneStandardRoles(companyId);

        if (result.success) {
            // Reload roles
            await loadRoles(companyId);
            // Reload roles
            await loadRoles(companyId);
            // alert(`✅ ${result.data?.roles_created || 0} roles estándar clonados correctamente`);
            // Removing alert for better UX or replacing with toast later. For now just cleaning emoji.
            alert(`${result.data?.roles_created || 0} roles estándar clonados correctamente`);
        } else {
            alert(`❌ ${result.message}`);
        }

        setIsCloning(false);
    }

    function handleCreateRole() {
        setRoleToEdit(null);
        setIsModalOpen(true);
    }

    function handleEditRole(role: CompanyRoleWithStats) {
        setRoleToEdit(role);
        setIsModalOpen(true);
    }

    async function handleDeleteRole(role: CompanyRoleWithStats) {
        if (role.members_count > 0) {
            alert(`No puedes eliminar este rol. ${role.members_count} usuario(s) lo están usando.`);
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
            return;
        }

        const result = await deleteRole(role.id);

        if (result.success) {
            if (companyId) {
                await loadRoles(companyId);
            }
            alert(`✅ ${result.message}`);
        } else {
            alert(`❌ ${result.message}`);
        }
    }

    function handleModalSuccess() {
        if (companyId) {
            loadRoles(companyId);
        }
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando roles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <div className="error-state">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Gestión de Roles</h1>
                </div>
                <p className="dashboard-subtitle">Configura los roles y permisos de tu empresa</p>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleCloneStandardRoles}
                        disabled={isCloning || roles.length > 0}
                    >
                        {isCloning ? (
                            'Clonando...'
                        ) : (
                            <>
                                <ClipboardList size={18} />
                                Cargar Roles Estándar
                            </>
                        )}
                    </button>
                    <button className="btn btn-primary" onClick={handleCreateRole}>
                        <Plus size={18} />
                        Crear Rol Personalizado
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            {roles.length === 0 && (
                <div className="info-banner">
                    <div className="banner-icon">
                        <Lightbulb size={24} />
                    </div>
                    <div className="banner-content">
                        <h3>No tienes roles configurados</h3>
                        <p>
                            Comienza cargando los <strong>14 roles estándar de piping</strong> o crea roles personalizados
                            desde cero.
                        </p>
                    </div>
                </div>
            )}

            {/* Roles Grid */}
            {roles.length > 0 && (
                <div className="roles-grid">
                    {roles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            onEdit={() => handleEditRole(role)}
                            onDelete={() => handleDeleteRole(role)}
                        />
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            {roles.length > 0 && (
                <div className="roles-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total de Roles:</span>
                        <span className="stat-value">{roles.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Roles del Sistema:</span>
                        <span className="stat-value">
                            {roles.filter((r) => r.is_template).length}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Roles Personalizados:</span>
                        <span className="stat-value">
                            {roles.filter((r) => !r.is_template).length}
                        </span>
                    </div>
                </div>
            )}

            {/* Role Editor Modal */}
            {companyId && (
                <RoleEditorModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setRoleToEdit(null);
                    }}
                    onSuccess={handleModalSuccess}
                    companyId={companyId}
                    roleToEdit={roleToEdit}
                />
            )}
        </div>
    );
}

// ==========================================
// Role Card Component
// ==========================================

interface RoleCardProps {
    role: CompanyRoleWithStats;
    onEdit: () => void;
    onDelete: () => void;
}

function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
    const baseRoleLabels = {
        admin: 'Admin',
        supervisor: 'Supervisor',
        worker: 'Worker'
    };

    const moduleCount = Object.values(role.permissions.modules || {}).filter(
        (m) => m?.enabled
    ).length;

    return (
        <div className="role-card" style={{ borderLeft: `4px solid ${role.color}` }}>
            <div className="role-card-header">
                <div className="role-badge" style={{ backgroundColor: role.color }}>
                    {role.name.charAt(0).toUpperCase()}
                </div>
                <div className="role-info">
                    <h3 className="role-name">{role.name}</h3>
                    <span className="role-base-type">{baseRoleLabels[role.base_role]}</span>
                </div>
                {role.is_template && (
                    <span className="template-badge">Sistema</span>
                )}
            </div>

            {role.description && (
                <p className="role-description">{role.description}</p>
            )}

            <div className="role-stats">
                <div className="stat">
                    <span className="stat-icon">
                        <Users size={16} />
                    </span>
                    <span className="stat-text">
                        {role.members_count} {role.members_count === 1 ? 'usuario' : 'usuarios'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-icon">
                        <Package size={16} />
                    </span>
                    <span className="stat-text">{moduleCount} módulos</span>
                </div>
            </div>

            <div className="role-card-actions">
                <button className="btn-icon" onClick={onEdit} title="Editar">
                    <Pencil size={18} />
                </button>
                <button
                    className="btn-icon btn-danger"
                    onClick={onDelete}
                    disabled={role.is_template || role.members_count > 0}
                    title={
                        role.is_template
                            ? 'No se pueden eliminar roles del sistema'
                            : role.members_count > 0
                                ? 'No se puede eliminar un rol en uso'
                                : 'Eliminar'
                    }
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
