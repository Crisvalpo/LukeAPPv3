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
    CheckCircle2,
    Copy,
    Shield,
    Info,
    ArrowLeft,
    AlertTriangle
} from 'lucide-react';
// Styles migrated to Tailwind v4
import { Heading, Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
// Styles migrated to Tailwind v4
import Confetti from '@/components/onboarding/Confetti';
import Toast from '@/components/onboarding/Toast';
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages';

import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RolesManagementPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<CompanyRoleWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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
            // Sort roles by hierarchy: admin (1) > supervisor (2) > worker (3)
            const rolePriority = { admin: 1, supervisor: 2, worker: 3 };
            const sortedRoles = (result.data || []).sort((a, b) => {
                return (rolePriority[a.base_role] || 99) - (rolePriority[b.base_role] || 99);
            });
            setRoles(sortedRoles);
        } else {
            setError(result.message ?? 'Error desconocido');
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

            // Trigger celebrations!
            setShowConfetti(true);
            setToastMessage(CELEBRATION_MESSAGES.roles);

            // Reset celebrations after animation
            setTimeout(() => {
                setShowConfetti(false);
            }, 3500);

            // Notify other components (like OnboardingWidget)
            window.dispatchEvent(new Event('onboarding-updated'));
            router.refresh();
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
                // Also update onboarding status in case they deleted the last role
                window.dispatchEvent(new Event('onboarding-updated'));
                router.refresh();
            }
            alert(`✅ ${result.message}`);
        } else {
            alert(`❌ ${result.message}`);
        }
    }

    function handleModalSuccess() {
        if (companyId) {
            // Check if this was the first role (task completion)
            const isFirstRole = roles.length === 0;

            loadRoles(companyId);

            if (isFirstRole) {
                // Trigger LARGE celebration only for the first role (Task Complete)
                setShowConfetti(true);
                setToastMessage(CELEBRATION_MESSAGES.roles);

                setTimeout(() => {
                    setShowConfetti(false);
                }, 3500);
            } else {
                // For subsequent roles, just show a Toast (no disruptive confetti)
                // Optionally we could show a different toast message
                // setToastMessage('Rol guardado correctamente'); 
                // Using existing toast component logic which might rely on message presence
                // For now, let's just NOT trigger the large confetti, but maybe still trigger the sidebar update
            }

            // Always notify other components (Sidebar widget needs to update progress)
            window.dispatchEvent(new Event('onboarding-updated'));
            router.refresh();
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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in px-4 md:px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="tracking-tight">Roles y Permisos</Heading>
                    </div>
                    <Text size="lg" className="text-text-muted max-w-2xl font-medium ml-4.5">
                        Gestiona los roles funcionales de tu organización y sus niveles de acceso.
                    </Text>
                </div>

                <div className="flex items-center gap-3 self-start md:self-end">
                    {!isLoading && roles.length === 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-full text-[10px] font-bold text-destructive uppercase tracking-widest animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Faltan Roles
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleCloneStandardRoles}
                        disabled={isCloning}
                        className="bg-white/5 border-glass-border hover:bg-white/10 text-text-muted hover:text-white rounded-xl"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        {isCloning ? 'Cargando...' : 'Cargar Roles Default'}
                    </Button>
                    <Button
                        onClick={handleCreateRole}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Rol
                    </Button>
                </div>
            </div>

            {/* Info Banner for empty state */}
            {roles.length === 0 && (
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl shadow-inner">
                            <Lightbulb className="w-8 h-8 text-brand-primary" />
                        </div>
                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <Heading level={3} className="text-xl font-bold text-white">Define los cargos de tu equipo</Heading>
                                <Text className="text-text-muted leading-relaxed">
                                    Crea roles personalizados según los <span className="text-white font-bold">cargos reales de tu obra</span>:
                                    "Pañolero", "Jefe de Calidad", "Capataz", "Encargado BIM", etc.
                                </Text>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Text size="sm" className="text-text-dim uppercase tracking-widest font-bold">Ejemplo: Encargado BIM</Text>
                                    <ul className="space-y-3">
                                        {[
                                            { icon: '📐', text: 'Engineering - Cargar isométricos' },
                                            { icon: '🏗️', text: 'BIM - Gestión de modelos' },
                                            { icon: '📊', text: 'Procurement - Consultar catálogo' }
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm text-text-muted font-medium">
                                                <span className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md border border-white/5">{item.icon}</span>
                                                {item.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
                                    <div className="flex items-center gap-2 text-brand-primary">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Tip Pro</span>
                                    </div>
                                    <Text size="sm" className="text-text-muted italic">
                                        Empieza cargando los <span className="text-brand-primary font-bold">14 roles estándar</span> del sector y ajústalos según las necesidades específicas de tu empresa.
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Roles Grid */}
            {roles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Stats Footer Bar */}
            {roles.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-bg-surface-1/80 backdrop-blur-2xl border border-glass-border rounded-2xl px-8 py-4 shadow-2xl flex items-center gap-12">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Total Roles</span>
                            <span className="text-xl font-bold text-white">{roles.length}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Sistema</span>
                            <span className="text-xl font-bold text-text-main">
                                {roles.filter((r) => r.is_template).length}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Personalizados</span>
                            <span className="text-xl font-bold text-brand-primary">
                                {roles.filter((r) => !r.is_template).length}
                            </span>
                        </div>
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

            {/* Celebration Components */}
            <Confetti show={showConfetti} />
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setToastMessage(null)}
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
        <div className="group relative bg-bg-surface-1/50 backdrop-blur-xl border border-glass-border rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-white/20 flex flex-col gap-6 overflow-hidden">
            {/* Role Color Accent Line */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:w-1.5"
                style={{ backgroundColor: role.color }}
            />

            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    {/* Large Role Initial Badge */}
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg border border-white/10"
                        style={{ backgroundColor: role.color }}
                    >
                        {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                            <Heading level={3} className="text-base font-bold text-white leading-snug">{role.name}</Heading>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                style={{ backgroundColor: `${role.color}10`, borderColor: `${role.color}30`, color: role.color }}
                            >
                                {baseRoleLabels[role.base_role]}
                            </div>
                            {role.is_template && (
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Sistema</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-2 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
                        onClick={onEdit}
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className="p-2 text-text-dim hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/10 disabled:hidden"
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
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Description */}
            <Text size="sm" className="text-text-muted line-clamp-2 min-h-[40px] leading-relaxed">
                {role.description || 'Sin descripción detallada.'}
            </Text>

            {/* Stats bar */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-text-dim" />
                        <span className="text-xs font-bold text-text-dim">
                            {role.members_count} <span className="font-medium text-text-muted">{role.members_count === 1 ? 'usuario' : 'usuarios'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package size={14} className="text-text-dim" />
                        <span className="text-xs font-bold text-text-dim">
                            {moduleCount} <span className="font-medium text-text-muted">módulos</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
