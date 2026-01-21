'use client';

import { useState, useEffect } from 'react';
import { createRole, updateRole } from '@/services/roles';
import type { CompanyRole, RolePermissions, CreateCompanyRoleParams, UpdateCompanyRoleParams } from '@/types';
import { MODULES } from '@/constants/modules';
import '@/styles/modal.css';

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
    }, [roleToEdit]);

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
            // Deep clone modules to avoid mutation
            newPermissions.modules = { ...(newPermissions.modules || {}) };

            const currentModule = newPermissions.modules[moduleId];

            // Toggle enabled state
            newPermissions.modules[moduleId] = {
                enabled: !currentModule?.enabled,
                is_home: currentModule?.is_home || false
            };

            return { ...prev, permissions: newPermissions };
        });
    }

    function handleSetHomeModule(moduleId: string) {
        setFormData((prev) => {
            const newPermissions = { ...prev.permissions };
            // Deep clone modules
            const modules = { ...(newPermissions.modules || {}) };
            newPermissions.modules = modules;

            // Unset all is_home flags
            Object.keys(modules).forEach((key) => {
                const mod = modules[key];
                if (mod) {
                    modules[key] = { ...mod, is_home: false };
                }
            });

            // Set this module as home (and enable it)
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

        // Validation
        if (!formData.name.trim()) {
            setError('El nombre del rol es obligatorio');
            return;
        }

        const modules = formData.permissions.modules || {};

        // Check if at least one module is enabled
        const hasEnabledModule = Object.values(modules).some(
            (m) => m?.enabled
        );

        if (!hasEnabledModule) {
            setError('Debes habilitar al menos un módulo');
            return;
        }

        // Check if a home module is set
        const hasHomeModule = Object.values(modules).some(
            (m) => m?.is_home
        );

        if (!hasHomeModule) {
            setError('Debes marcar un módulo como "Inicio"');
            return;
        }

        setIsSubmitting(true);

        try {
            let result;

            if (roleToEdit) {
                // Update existing role
                const updates: UpdateCompanyRoleParams = {
                    name: formData.name,
                    description: formData.description || undefined,
                    color: formData.color,
                    base_role: formData.base_role,
                    permissions: formData.permissions
                };
                result = await updateRole(roleToEdit.id, updates);
            } else {
                // Create new role
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

    const modules = formData.permissions.modules || {};
    const enabledModules = Object.entries(modules)
        .filter(([_, config]) => config?.enabled)
        .map(([id]) => id);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{roleToEdit ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Nombre del Rol *
                        </label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Jefe de Calidad"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe las responsabilidades de este rol"
                            rows={3}
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="form-group">
                        <label className="form-label">Color del Badge</label>
                        <div className="color-picker">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-swatch ${formData.color === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData({ ...formData, color })}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Base Role */}
                    <div className="form-group">
                        <label htmlFor="base_role" className="form-label">
                            Nivel de Sistema (para seguridad RLS) *
                        </label>
                        <select
                            id="base_role"
                            className="form-select"
                            value={formData.base_role}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    base_role: e.target.value as 'admin' | 'supervisor' | 'worker'
                                })
                            }
                            required
                        >
                            <option value="worker">Worker - Acceso básico</option>
                            <option value="supervisor">Supervisor - Acceso medio</option>
                            <option value="admin">Admin - Acceso completo</option>
                        </select>
                        <p className="form-hint">
                            Define los permisos de base de datos. No afecta la UX.
                        </p>
                    </div>

                    {/* Module Permissions */}
                    <div className="form-group">
                        <label className="form-label">Módulos Habilitados *</label>
                        <p className="form-hint">
                            Selecciona a qué módulos tendrá acceso este rol. Marca uno como "Inicio".
                        </p>
                        <div className="module-toggles">
                            {Object.entries(MODULES).map(([key, module]) => {
                                const moduleId = module.id;
                                const isEnabled = modules[moduleId]?.enabled;
                                const isHome = modules[moduleId]?.is_home;

                                return (
                                    <div
                                        key={moduleId}
                                        className={`module-toggle ${isEnabled ? 'enabled' : ''}`}
                                    >
                                        <div className="module-toggle-header">
                                            <div className="module-info">
                                                <span className="module-icon">{module.icon}</span>
                                                <div>
                                                    <div className="module-name">{module.name}</div>
                                                    <div className="module-desc">{module.description}</div>
                                                </div>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled || false}
                                                    onChange={() => handleModuleToggle(moduleId)}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        {isEnabled && (
                                            <div className="module-home-option">
                                                <label className="home-checkbox">
                                                    <input
                                                        type="radio"
                                                        name="home_module"
                                                        checked={isHome || false}
                                                        onChange={() => handleSetHomeModule(moduleId)}
                                                    />
                                                    <span>Marcar como Inicio</span>
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
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : roleToEdit ? 'Actualizar Rol' : 'Crear Rol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
