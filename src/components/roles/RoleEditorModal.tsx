'use client';

import { useState, useEffect } from 'react';
import { createRole, updateRole } from '@/services/roles';
import type { CompanyRole, RolePermissions, CreateCompanyRoleParams, UpdateCompanyRoleParams } from '@/types';
import { MODULES } from '@/constants/modules';
import { X, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/Typography';

interface RoleEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companyId: string;
    roleToEdit?: CompanyRole | null;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
    modules: {
        dashboard: { enabled: false, is_home: false },
        engineering: { enabled: false, is_home: false },
        field: { enabled: false, is_home: false },
        quality: { enabled: false, is_home: false },
        warehouse: { enabled: false, is_home: false }
    },
    resources: {}
};

const PRESET_COLORS = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#64748b'  // Slate
];

export default function RoleEditorModal({
    isOpen,
    onClose,
    onSuccess,
    companyId,
    roleToEdit
}: RoleEditorModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#8b5cf6',
        base_role: 'worker' as 'admin' | 'supervisor' | 'worker',
        permissions: DEFAULT_PERMISSIONS
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (roleToEdit) {
            setFormData({
                name: roleToEdit.name,
                description: roleToEdit.description || '',
                color: roleToEdit.color,
                base_role: roleToEdit.base_role,
                permissions: roleToEdit.permissions
            });
        } else {
            resetForm();
        }
    }, [roleToEdit, isOpen]);

    function resetForm() {
        setFormData({
            name: '',
            description: '',
            color: '#8b5cf6',
            base_role: 'worker',
            permissions: DEFAULT_PERMISSIONS
        });
        setError('');
    }

    function handleModuleToggle(moduleId: string) {
        setFormData((prev) => {
            const newPermissions = { ...prev.permissions };
            newPermissions.modules = { ...(newPermissions.modules || {}) };

            const currentModule = newPermissions.modules[moduleId];
            const isNowEnabled = !currentModule?.enabled;

            // Toggle enabled state
            newPermissions.modules[moduleId] = {
                enabled: isNowEnabled,
                is_home: isNowEnabled ? currentModule?.is_home : false
            };

            return { ...prev, permissions: newPermissions };
        });
    }

    function handleSetHomeModule(moduleId: string) {
        setFormData((prev) => {
            const newPermissions = { ...prev.permissions };
            const modules = { ...(newPermissions.modules || {}) };
            newPermissions.modules = modules;

            Object.keys(modules).forEach((key) => {
                const mod = modules[key];
                if (mod) {
                    modules[key] = { ...mod, is_home: false };
                }
            });

            const targetMod = modules[moduleId];
            if (!targetMod) {
                modules[moduleId] = { enabled: true, is_home: true };
            } else {
                modules[moduleId] = { ...targetMod, enabled: true, is_home: true };
            }

            return { ...prev, permissions: newPermissions };
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('El nombre del rol es obligatorio');
            return;
        }

        const modules = formData.permissions.modules || {};
        const hasEnabledModule = Object.values(modules).some((m) => m?.enabled);

        if (!hasEnabledModule) {
            setError('Debes habilitar al menos un módulo');
            return;
        }

        const hasHomeModule = Object.values(modules).some((m) => m?.is_home);

        if (!hasHomeModule) {
            setError('Debes marcar un módulo como "Inicio"');
            return;
        }

        setIsSubmitting(true);

        try {
            let result;

            if (roleToEdit) {
                const updates: UpdateCompanyRoleParams = {
                    name: formData.name,
                    description: formData.description || undefined,
                    color: formData.color,
                    base_role: formData.base_role,
                    permissions: formData.permissions
                };
                result = await updateRole(roleToEdit.id, updates);
            } else {
                const params: CreateCompanyRoleParams = {
                    company_id: companyId,
                    name: formData.name,
                    description: formData.description || undefined,
                    color: formData.color,
                    base_role: formData.base_role,
                    permissions: formData.permissions
                };
                result = await createRole(params);
            }

            if (result.success) {
                onSuccess();
                onClose();
                resetForm();
            } else {
                setError(result.message || 'Error desconocido');
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar el rol');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) return null;

    const currentModules = formData.permissions.modules || {};

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
            <div
                className="bg-bg-surface-1/90 backdrop-blur-2xl border border-glass-border w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-1.2 h-6 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <Heading level={2} className="text-xl font-bold tracking-tight">
                            {roleToEdit ? 'Editar Rol' : 'Crear Nuevo Rol'}
                        </Heading>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text-dim hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-bold text-text-muted ml-1 flex items-center gap-2">
                                Nombre del Rol <span className="text-brand-primary">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-text-dim"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Jefe de Calidad"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-bold text-text-muted ml-1">
                                Descripción
                            </label>
                            <textarea
                                id="description"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-text-dim min-h-[100px] resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe las responsabilidades de este rol"
                                rows={3}
                            />
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-muted ml-1">Color del Badge</label>
                            <div className="flex flex-wrap gap-2.5">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95 ${formData.color === color
                                            ? 'ring-2 ring-white ring-offset-4 ring-offset-bg-surface-1 scale-105'
                                            : 'hover:opacity-80'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                        title={color}
                                    >
                                        {formData.color === color && <Check size={18} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Base Role */}
                        <div className="space-y-3">
                            <label htmlFor="base_role" className="text-sm font-bold text-text-muted ml-1 flex items-center gap-2">
                                Nivel de Sistema <span className="text-text-dim font-normal text-xs">(Seguridad RLS)</span>
                            </label>
                            <div className="relative group">
                                <select
                                    id="base_role"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm appearance-none focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all cursor-pointer"
                                    value={formData.base_role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            base_role: e.target.value as 'admin' | 'supervisor' | 'worker'
                                        })
                                    }
                                    required
                                >
                                    <option value="worker" className="bg-slate-900">Worker - Acceso básico</option>
                                    <option value="supervisor" className="bg-slate-900">Supervisor - Acceso medio</option>
                                    <option value="admin" className="bg-slate-900">Admin - Acceso completo</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim group-hover:text-white transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <Text size="xs" className="text-text-dim italic ml-1">
                                Define los permisos a nivel de base de datos.
                            </Text>
                        </div>
                    </div>

                    {/* Module Permissions */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-text-muted ml-1">Módulos Habilitados</label>
                            <Text size="xs" className="text-text-dim ml-1">Selecciona los módulos y define la página de inicio.</Text>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(MODULES).map(([key, module]) => {
                                const moduleId = module.id;
                                const isEnabled = currentModules[moduleId]?.enabled;
                                const isHome = currentModules[moduleId]?.is_home;

                                return (
                                    <div
                                        key={moduleId}
                                        className={`group/module border rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${isEnabled
                                            ? 'bg-brand-primary/5 border-brand-primary/30'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <div className="p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border transition-colors ${isEnabled ? 'bg-brand-primary/20 border-brand-primary/40' : 'bg-white/5 border-white/5'
                                                    }`}>
                                                    {module.icon}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className={`text-sm font-bold transition-colors ${isEnabled ? 'text-white' : 'text-text-muted'}`}>
                                                        {module.name}
                                                    </span>
                                                    <p className="text-[11px] text-text-dim leading-tight sm:block hidden max-w-[200px] truncate">
                                                        {module.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Premium Switch */}
                                            <button
                                                type="button"
                                                onClick={() => handleModuleToggle(moduleId)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none ${isEnabled ? 'bg-brand-primary' : 'bg-white/10'
                                                    }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>

                                        {/* Home Module Option */}
                                        {isEnabled && (
                                            <div className="px-5 pb-5 pt-0 flex items-center gap-3 animate-slide-down">
                                                <div className="w-12 flex justify-center">
                                                    <div className="w-px h-4 bg-brand-primary/30" />
                                                </div>
                                                <label className="flex items-center gap-2.5 cursor-pointer group/home">
                                                    <input
                                                        type="radio"
                                                        name="home_module"
                                                        className="sr-only"
                                                        checked={isHome || false}
                                                        onChange={() => handleSetHomeModule(moduleId)}
                                                    />
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isHome ? 'border-brand-primary bg-brand-primary' : 'border-white/20 group-hover:border-white/40'
                                                        }`}>
                                                        {isHome && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isHome ? 'text-brand-primary' : 'text-text-dim group-hover:text-text-muted'
                                                        }`}>
                                                        Marcar como Inicio
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                            <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <Text size="sm" className="text-destructive font-medium">{error}</Text>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 flex gap-4 bg-white/5">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 rounded-2xl h-14 font-bold text-text-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 rounded-2xl h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Guardando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save size={18} />
                                <span>{roleToEdit ? 'Actualizar Rol' : 'Crear Rol'}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
