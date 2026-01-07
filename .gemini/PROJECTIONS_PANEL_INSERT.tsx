{/* ============================================================
    PANEL DE PROYECCIONES INTELIGENTES
    Insertar DENTRO del bloque {pipeNeeds.length > 0 ? (...) : (...)}
    DESPUÉS de </div> que cierra la tabla
    ANTES del ) : ( del ternario
============================================================ */}

{/* Projections Panel */ }
{
    isPartialDesign && projectedNeeds.length > 0 && (
        <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: confidenceLevel === 'low'
                ? 'rgba(239, 68, 68, 0.1)'
                : confidenceLevel === 'medium'
                    ? 'rgba(251, 146, 60, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${confidenceLevel === 'low'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : confidenceLevel === 'medium'
                        ? 'rgba(251, 146, 60, 0.3)'
                        : 'rgba(59, 130, 246, 0.3)'
                }`,
            borderRadius: '12px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
            }}>
                <AlertTriangle
                    size={24}
                    color={
                        confidenceLevel === 'low' ? '#ef4444' :
                            confidenceLevel === 'medium' ? '#fb923c' :
                                '#3b82f6'
                    }
                />
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                        Proyección de Necesidades (100% Diseño)
                    </h4>
                    <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                        Basado en {designCompletionPercent}% de diseño completado
                        {confidenceLevel === 'high' && ' - Alta confiabilidad'}
                        {confidenceLevel === 'medium' && ' - Confiabilidad media'}
                        {confidenceLevel === 'low' && ' - Baja confiabilidad, datos insuficientes'}
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Calculado Actual
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
                        {totalMetersNeeded.toFixed(1)}m
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {totalSticksEstimated} varas
                    </div>
                </div>

                <div style={{
                    padding: '1rem',
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: '#e9d5ff', textTransform: 'uppercase', fontWeight: 600 }}>
                        Proyección 100%
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.25rem' }}>
                        ~{totalProjectedMeters.toFixed(1)}m
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#e9d5ff' }}>
                        ~{totalProjectedSticks} varas
                    </div>
                </div>

                <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Incremento Estimado
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.25rem' }}>
                        +{(totalProjectedMeters - totalMetersNeeded).toFixed(1)}m
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        +{totalProjectedSticks - totalSticksEstimated} varas
                    </div>
                </div>
            </div>

            {confidenceLevel === 'low' && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#fca5a5'
                }}>
                    <strong>⚠️ Advertencia:</strong> El diseño está menos del 40% completo.
                    Las proyecciones pueden variar significativamente.
                    Se recomienda esperar a tener más diseño antes de realizar compras grandes.
                </div>
            )}

            {confidenceLevel === 'medium' && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(251, 146, 60, 0.15)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#fdba74'
                }}>
                    <strong>💡 Sugerencia:</strong> El diseño está {designCompletionPercent}% completo.
                    Las proyecciones son razonablemente confiables,
                    pero considera un margen de seguridad de +10-15% en tus compras.
                </div>
            )}

            {confidenceLevel === 'high' && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#86efac'
                }}>
                    <strong>✓ Alta confianza:</strong> El diseño está {designCompletionPercent}% completo.
                    Las proyecciones son altamente confiables.
                    Puedes planificar compras con seguridad basándote en estos números.
                </div>
            )}
        </div>
    )
}
