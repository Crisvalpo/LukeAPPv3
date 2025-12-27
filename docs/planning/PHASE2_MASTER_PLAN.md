# Phase 2: Master Revision System Plan (Event-Driven & Operationally Aware)

**Status:** APPROVED FOR DEVELOPMENT  
**Architecture:** Event-Driven (Approach B)  
**Philosophy:** "La ingeniería cambia, pero la obra no se rompe."

---

## 🎯 Objetivo de la Fase

Implementar un sistema de control documental y revisiones de ingeniería capaz de:
1.  **Anunciar** nuevas revisiones como eventos.
2.  **Detectar** impactos *solo* si existe producción afectada.
3.  **Gestionar** responsabilidad de materiales (Cliente vs Constructor).
4.  **Resolver** conflictos estratégicamente (ej. "Unión Gratis").
5.  **Mantener** trazabilidad inmutable (Event Sourcing).

---

## 1. Regla Operativa Clave: Impacto Condicional

**Principio:** NO toda revisión genera impactos. El sistema solo genera impacto si existe **producción previa** asociada a una revisión anterior.

### Definición de "Producción"
Se considera que existe producción si ocurre alguno de estos eventos sobre una revisión anterior:
- Spools fabricados.
- Uniones ejecutadas.
- Material consumido o cortado.
- Spools despachados a terreno.

### Lógica Automática
```typescript
if (!hasPreviousProduction(oldRevision)) {
  // Caso A: Ingeniería pura -> Sin dolor
  markAsVigente(newRevision)
  return [] // NO impacts, auto-apply
}

if (hasSpoolsButNoExecution(oldRevision)) {
  // Caso B: Spooleado pero no ejecutado -> Impacto Logístico
  detectMaterialImpactsOnly()
  markAsInformative()
}

if (hasExecutedWork(oldRevision)) {
  // Caso C: Obra en marcha -> Impacto Crítico
  detectFullImpacts()
  requireApprovalWorkflow()
}
```

---

## 2. Nueva Dimensión: Material Responsibility

**Problema:** Un cambio de ingeniería puede inutilizar material. ¿Quién paga?
**Solución:** Atributo de responsabilidad contractual.

### Schema Extension (`materials` table)
```sql
ALTER TABLE materials ADD COLUMN material_owner TEXT 
CHECK (material_owner IN ('CLIENT', 'CONTRACTOR', 'MIXED'));

ALTER TABLE materials ADD COLUMN is_critical BOOLEAN DEFAULT false; 
-- True para NACE, aleaciones especiales, etc.
```

**Regla de Negocio:**
Si `impact_type = 'MODIFIED/REMOVED'` AND `material_owner = 'CLIENT'` AND `production_status = 'EXECUTED'`:
🚨 **Alerta de Riesgo Contractual:** "Material suministrado por cliente inutilizado por cambio de ingeniería."

---

## 3. Resoluciones Estratégicas (Workflow)

**Filosofía:** LukeAPP detecta errores pero habilita decisiones de liderazgo. No todo error es un bloqueo.

### Catálogo de Resoluciones (`revision_impacts`)

| Resolution Type | Descripción | Rol Mínimo |
|----------------|-------------|------------|
| `REWORK` | Rehacer trabajo (costo proyecto) | Supervisor |
| `MATERIAL_RETURN` | Devolver material a bodega | Supervisor |
| `FREE_JOINT` | **Decisión Estratégica:** Constructor asume costo | Admin / Jefe Proyecto |
| `TECHNICAL_EXCEPTION` | Se mantiene diseño anterior (con firma) | Admin |
| `CLIENT_APPROVAL` | Cliente paga el cambio (Change Order) | Admin |

**Implementación DB:**
```sql
ALTER TABLE revision_impacts 
ADD COLUMN resolution_type TEXT,
ADD COLUMN resolution_notes TEXT,
ADD COLUMN resolved_by UUID REFERENCES auth.users(id),
ADD COLUMN resolved_at TIMESTAMPTZ;
```

---

## 4. Arquitectura Event-Driven (Core)

El estado del sistema es una proyección de eventos.

### Entidades Principales

1.  **`engineering_revisions`** (The Event)
    - `entity_type`: 'isometric' | 'line' | 'spool'
    - `status`: DRAFT → PENDING → APPROVED → APPLIED
    - `snapshot_id`: Link al estado del proyecto al momento de aplicar.

2.  **`revision_events`** (The Log)
    - Registro inmutable: "Revision Created", "Impact Detected", "Resolution Applied".

3.  **`production_snapshot`** (The Baseline)
    - Foto congelada de spools/joints al momento del cambio.
    - Permite comparar "lo que había" vs "lo que llega".

---

## 5. UI/UX: Gestión de Realidad

### Pantalla de Anuncio
- **Visual:** Lista de isométricos con semáforo.
- **Acción:** Carga de Excel Maestro.
- **Feedback:** "5 Revisiones nuevas. 3 Auto-aplicadas (sin producción). 2 Requieren análisis."

### Pantalla de Impactos (The War Room)
- **Foco:** Solo muestra lo que duele.
- **Datos:** Spool afectado | Material Owner | Estado Producción.
- **Acciones:** Dropdown de Resolución Estratégica.

**Ejemplo de Item:**
> ⚠️ **Spool 104** (Fabricado)
> Cambio: Diámetro 4" -> 6"
> Material: Cliente (NACE)
> **Acción:** [ Solicitar Adicional ] [ Asumir Costo (Free Joint) ]

---

## 6. Roadmap de Implementación (10-12 Días)

### Sprint 1: Foundation & Events (Days 1-3)
- [ ] Tablas: `engineering_revisions`, `revision_impacts`, `materials(owner)`.
- [ ] Service: `RevisionEventService` (Event sourcing logic).
- [ ] RLS Policies.

### Sprint 2: Detection Engine (Days 4-7)
- [ ] Logic: `detectImpacts(oldRev, newRev)`.
- [ ] Helper: `getProductionStatus(spoolId)`.
- [ ] Auto-apply logic for "Phase 0" revisions.

### Sprint 3: Strategic Workflow (Days 8-10)
- [ ] UI: Revision Dashboard.
- [ ] UI: Resolution Modal with "Strategy" options.
- [ ] Integration with Inventory (material returns).

### Sprint 4: Verification (Days 11-12)
- [ ] E2E Testing: Scenarios A, B, C.
- [ ] Guardrails: Block fabrication of "Pending" revisions.

---

## 7. Mensaje Final al Desarrollador

> **"El sistema cuida los datos, el líder cuida el proyecto."**

No construyas un sistema que solo diga "NO". Construye un sistema que diga: **"Hay un problema, aquí están tus opciones, registra tu decisión."**
