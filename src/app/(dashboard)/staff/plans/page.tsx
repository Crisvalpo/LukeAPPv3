'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Icons } from '@/components/ui/Icons';
import { Heading, Text } from '@/components/ui/Typography';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/button';

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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Gestión de Planes Globales</Heading>
                </div>
                <Text size="base" className="text-text-muted text-sm font-medium ml-4.5 max-w-2xl">
                    Ajusta los límites y precios de los planes base. Los cambios afectan a todas las empresas suscritas.
                </Text>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 animate-in fade-in slide-in-from-top-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isEditing = editingId === plan.id;
                    const currentData = isEditing && tempPlan ? tempPlan : plan;

                    return (
                        <div
                            key={plan.id}
                            className={`bg-bg-surface-1 border border-glass-border rounded-xl p-6 shadow-xl transition-all duration-300 ${isEditing ? 'ring-2 ring-brand-primary/50' : 'hover:border-brand-primary/30'}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="space-y-1">
                                    <Heading level={3} className="text-xl font-bold text-text-main">{currentData.name}</Heading>
                                    <span className="inline-block px-2 py-0.5 bg-bg-surface-2 border border-glass-border rounded text-[10px] font-mono text-text-dim uppercase tracking-wider">
                                        {currentData.id}
                                    </span>
                                </div>
                                {!isEditing && (
                                    <Button
                                        onClick={() => handleEdit(plan)}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border-none"
                                    >
                                        Editar
                                    </Button>
                                )}
                            </div>

                            {/* Form/Display */}
                            <div className="space-y-6">
                                {/* Price */}
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <InputField
                                            label="Precio Mensual (CLP)"
                                            type="number"
                                            value={currentData.price_monthly}
                                            onChange={(e) => handleInputChange('price_monthly', parseInt(e.target.value) || 0)}
                                            className="bg-bg-surface-2 border-glass-border focus:border-brand-primary"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-bg-surface-2/50 border border-glass-border rounded-lg p-4">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">Precio Mensual (CLP)</label>
                                        <div className="text-2xl font-bold text-brand-primary flex items-baseline gap-1">
                                            ${Number(currentData.price_monthly).toLocaleString('es-CL')}
                                            <span className="text-sm font-medium text-text-dim"> / mes</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Max Users */}
                                    {isEditing ? (
                                        <InputField
                                            label="Usuarios"
                                            type="number"
                                            value={currentData.max_users}
                                            onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 0)}
                                        />
                                    ) : (
                                        <div className="bg-bg-surface-2 border border-glass-border rounded-lg p-3">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Usuarios</label>
                                            <div className="text-base font-semibold text-text-main">
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
                                        <div className="bg-bg-surface-2 border border-glass-border rounded-lg p-3">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Proyectos</label>
                                            <div className="text-base font-semibold text-text-main">
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
                                        <div className="bg-bg-surface-2 border border-glass-border rounded-lg p-3">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Spools</label>
                                            <div className="text-base font-semibold text-text-main">
                                                {(!currentData.max_spools || currentData.max_spools === 999999) ? 'Ilimitado' : currentData.max_spools}
                                            </div>
                                        </div>
                                    )}

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
                                        <div className="bg-bg-surface-2 border border-glass-border rounded-lg p-3">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Almacenamiento</label>
                                            <div className="text-base font-semibold text-text-main">
                                                {currentData.max_storage_gb === 999999 ? 'Ilimitado' : `${currentData.max_storage_gb} GB`}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Características Adicionales</label>
                                        <p className="text-[10px] text-text-dim/60 italic mb-2">Una por línea (ej: "Soporte prioritario")</p>
                                        <textarea
                                            value={Array.isArray(currentData.features) ? currentData.features.join('\n') : ''}
                                            onChange={(e) => {
                                                const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                                                handleInputChange('features', lines);
                                            }}
                                            className="w-full bg-bg-surface-2 border border-glass-border rounded-lg p-3 text-sm text-text-main focus:ring-1 focus:ring-brand-primary outline-none min-h-[120px]"
                                            placeholder="Soporte prioritario&#10;Reportes avanzados"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Características</label>
                                        <div className="space-y-2">
                                            {Array.isArray(currentData.features) && currentData.features.length > 0 ? (
                                                currentData.features.map((feature: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm text-text-muted">
                                                        <div className="w-1 h-1 bg-brand-primary rounded-full shrink-0" />
                                                        {feature}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-text-dim italic">Sin características adicionales</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {isEditing && (
                                <div className="mt-8 pt-6 border-t border-glass-border flex items-center gap-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                        className="flex-1 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold"
                                    >
                                        {saveLoading ? <Icons.Refresh className="animate-spin" size={16} /> : <Icons.Save size={16} />}
                                        Guardar Cambios
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={saveLoading}
                                        variant="secondary"
                                        className="px-3"
                                    >
                                        <Icons.Close size={20} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
