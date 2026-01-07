# 📋 INSTRUCCIONES: Insertar Panel de Proyecciones

## 📁 Archivo a editar:
`src/components/procurement/PipeInventoryMaster.tsx`

## 📍 Ubicación exacta:

Busca en el archivo la sección del **Planning Tab**, específicamente donde está la tabla de resultados.

Encontrarás algo como esto (alrededor de la línea 518):

```tsx
                                </tbody>
                            </table>
                        </div>
                    ) : (                              ← BUSCA ESTE ) : (
                        <div className="empty-state">
```

## ✂️ PASO 1: Eliminar código problemático

**ELIMINA** todo el bloque entre `</table>` y el `) : (` que esté mal estructurado.

Si ves algo como:
```tsx
</table>
</div>

{/* Projections Panel */}
{isPartialDesign && ...
  ... código largo ...
)}
</div>
)}
) : (
```

**Elimínalo TODO** hasta dejar solo:
```tsx
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
```

## 📋 PASO 2: Insertar el panel correcto

**COPIA** todo el contenido del archivo:
`.gemini/PROJECTIONS_PANEL_INSERT.tsx`

**PÉGALO** justo ANTES del `) : (`, así:

```tsx
                                </tbody>
                            </table>
                        </div>

                        {/* AQUÍ VA EL PANEL DE PROYECCIONES COPIADO */}
                        
                    ) : (
                        <div className="empty-state">
```

## ⚠️ IMPORTANTE: Indentación

El contenido que pegas debe tener **24 espacios** de indentación base (6 niveles de 4 espacios).

El primer `{/*` del panel debe quedar alineado con el `</div>` superior.

## ✅ RESULTADO ESPERADO:

```tsx
                            </table>
                        </div>

                        {/* Projections Panel */}
                        {isPartialDesign && projectedNeeds.length > 0 && (
                            <div style={{
                                marginTop: '2rem',
                                ...
                            }}>
                                ...todo el contenido del panel...
                            </div>
                        )}
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Calculator size={48} />
                            </div>
                            <h4>No hay cálculos activos</h4>
                            <p>Haz click en "Calcular Total" para analizar las necesidades de cañería del proyecto</p>
                        </div>
                    )}
                </div>
            )}
```

## 🧪 VERIFICACIÓN:

Después de insertar:
1. Guarda el archivo (Ctrl + S)
2. Revisa la consola - NO debe haber errores de compilación
3. Refresca el navegador
4. Ve a: Founder → Projects → [Proyecto] → Abastecimiento → Gestión de Cañería
5. Haz click en "Calcular Total"
6. Si el diseño está < 100%, verás el panel de proyecciones 🎉

## 🎯 Características del Panel:

- **Color dinámico** según nivel de confianza:
  - 🔴 Rojo: < 40% diseño (baja confianza)
  - 🟠 Naranja: 40-70% diseño (media confianza)
  - 🔵 Azul: > 70% diseño (alta confianza)

- **3 Cards de métricas:**
  - Calculado Actual (metros y varas actuales)
  - Proyección 100% (estimación al completar diseño)
  - Incremento Estimado (diferencia)

- **Mensaje contextual** según confianza con recomendaciones

---

## 🆘 Si hay problemas:

1. **Verifica los cierres de llaves** - deben estar balanceados
2. **Verifica la indentación** - todo el panel debe estar al mismo nivel que `</div>` superior
3. **Asegúrate de que el `) : (` quede DESPUÉS del panel**, no antes

---

¿Listo para copiar? El contenido está en:
**`.gemini/PROJECTIONS_PANEL_INSERT.tsx`** ✅
