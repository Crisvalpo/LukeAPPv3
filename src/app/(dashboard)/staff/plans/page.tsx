'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Icons } from '@/components/ui/Icons';
import { Heading, Text } from '@/components/ui/Typography';
import { InputField } from '@/components/ui/InputField';
import '@/styles/dashboard.css';
import '@/styles/staff-plans.css';

type Plan = Database['public']['Tables']['subscription_plans']['Row'];

export default function PlansManager() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempPlan, setTempPlan] = useState<Plan | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) {
            console.error('Error fetching plans:', error);
            setError('No se pudieron cargar los planes.');
        } else {
            setPlans(data || []);
            setError(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan: Plan) => {
        setEditingId(plan.id);
        setTempPlan({ ...plan });
    };

    const handleCancel = () => {
        setEditingId(null);
        setTempPlan(null);
    };

    const handleSave = async () => {
        if (!tempPlan) return;
        setSaveLoading(true);

        const { error } = await supabase
            .from('subscription_plans')
            .update({
                name: tempPlan.name,
                price_monthly: tempPlan.price_monthly,
                max_users: tempPlan.max_users,
                max_projects: tempPlan.max_projects,
                max_spools: tempPlan.max_spools,
                max_storage_gb: tempPlan.max_storage_gb,
                features: tempPlan.features
            })
            .eq('id', tempPlan.id);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            await fetchPlans();
            setEditingId(null);
            setTempPlan(null);
        }
        setSaveLoading(false);
    };

    const handleInputChange = (field: keyof Plan, value: any) => {
        if (tempPlan) {
            setTempPlan({ ...tempPlan, [field]: value });
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <Text size="base" style={{ textAlign: 'center' }}>Cargando planes...</Text>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">Gestión de Planes Globales</Heading>
                </div>
                <Text size="base" className="dashboard-subtitle">
                    Ajusta los límites y precios de los planes base. Los cambios afectan a todas las empresas suscritas.
                </Text>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <div className="plans-grid">
                {plans.map((plan) => {
                    const isEditing = editingId === plan.id;
                    const currentData = isEditing && tempPlan ? tempPlan : plan;

                    return (
                        <div
                            key={plan.id}
                            className={`plan-card ${isEditing ? 'editing' : ''}`}
                        >
                            {/* Header */}
                            <div className="plan-card-header">
                                <div className="plan-name">
                                    <Heading level={3}>{currentData.name}</Heading>
                                    <span className="plan-id-badge">
                                        {currentData.id}
                                    </span>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => handleEdit(plan)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Editar
                                    </button>
                                )}
                            </div>

                            {/* Form/Display */}
                            <div className="plan-form-group">
                                {/* Price */}
                                {isEditing ? (
                                    <InputField
                                        label="Precio Mensual (CLP)"
                                        type="number"
                                        value={currentData.price_monthly}
                                        onChange={(e) => handleInputChange('price_monthly', parseInt(e.target.value) || 0)}
                                    />
                                ) : (
                                    <div>
                                        <label className="form-label">Precio Mensual (CLP)</label>
                                        <div className="plan-price-display">
                                            ${Number(currentData.price_monthly).toLocaleString('es-CL')}
                                            <span className="plan-price-period"> / mes</span>
                                        </div>
                                    </div>
                                )}

                                <div className="plan-metrics-grid">
                                    {/* Max Users */}
                                    {isEditing ? (
                                        <InputField
                                            label="Usuarios"
                                            type="number"
                                            value={currentData.max_users}
                                            onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 0)}
                                        />
                                    ) : (
                                        <div>
                                            <label className="form-label">Usuarios</label>
                                            <div className="metric-value">
                                                {currentData.max_users === 999999 ? 'Ilimitado' : currentData.max_users}
                                            </div>
                                        </div>
                                    )}

                                    {/* Max Projects */}
                                    {isEditing ? (
                                        <InputField
                                            label="Proyectos"
                                            type="number"
                                            value={currentData.max_projects}
                                            onChange={(e) => handleInputChange('max_projects', parseInt(e.target.value) || 0)}
                                        />
                                    ) : (
                                        <div>
                                            <label className="form-label">Proyectos</label>
                                            <div className="metric-value">
                                                {currentData.max_projects === 999999 ? 'Ilimitado' : currentData.max_projects}
                                            </div>
                                        </div>
                                    )}

                                    {/* Max Spools */}
                                    {isEditing ? (
                                        <InputField
                                            label="Spools"
                                            type="number"
                                            value={currentData.max_spools || 0}
                                            onChange={(e) => handleInputChange('max_spools', parseInt(e.target.value) || 0)}
                                        />
                                    ) : (
                                        <div>
                                            <label className="form-label">Spools</label>
                                            <div className="metric-value">
                                                {(!currentData.max_spools || currentData.max_spools === 999999) ? 'Ilimitado' : currentData.max_spools}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Storage */}
                                {isEditing ? (
                                    <InputField
                                        label="Almacenamiento (GB)"
                                        type="number"
                                        step="0.01"
                                        value={currentData.max_storage_gb || 0}
                                        onChange={(e) => handleInputChange('max_storage_gb', parseFloat(e.target.value) || 0)}
                                    />
                                ) : (
                                    <div>
                                        <label className="form-label">Almacenamiento</label>
                                        <div className="metric-value">
                                            {currentData.max_storage_gb === 999999 ? 'Ilimitado' : `${currentData.max_storage_gb} GB`}
                                        </div>
                                    </div>
                                )}

                                {/* Features */}
                                {isEditing ? (
                                    <div>
                                        <label className="form-label">Características Adicionales</label>
                                        <Text size="xs" variant="dim" className="form-hint" style={{ marginBottom: 'var(--spacing-2)' }}>
                                            Una característica por línea (ej: "Soporte prioritario")
                                        </Text>
                                        <textarea
                                            value={Array.isArray(currentData.features) ? currentData.features.join('\n') : ''}
                                            onChange={(e) => {
                                                const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                                                handleInputChange('features', lines);
                                            }}
                                            className="form-input"
                                            rows={5}
                                            placeholder="Soporte prioritario&#10;Reportes avanzados&#10;API personalizada"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="form-label">Características Adicionales</label>
                                        <ul className="features-list">
                                            {Array.isArray(currentData.features) && currentData.features.length > 0 ? (
                                                currentData.features.map((feature: any, idx: number) => (
                                                    <li key={idx} className="feature-item">{feature}</li>
                                                ))
                                            ) : (
                                                <li className="feature-empty">Sin características adicionales</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {isEditing && (
                                <div className="plan-actions">
                                    <button
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                        className="btn btn-primary"
                                    >
                                        {saveLoading ? <Icons.Refresh className="spin" size={16} /> : <Icons.Save size={16} />}
                                        Guardar
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saveLoading}
                                        className="btn btn-secondary btn-icon"
                                    >
                                        <Icons.Close size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
