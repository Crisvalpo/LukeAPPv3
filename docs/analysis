# Análisis del Repositorio PIPING Anterior

**Fecha**: 23/12/2025  
**Propósito**: Identificar componentes y estructuras reutilizables para **LukeAPP Fase 2: Ingeniería y Carga de Datos**

---

## 📊 Hallazgos Clave

### 1. Stack Tecnológico Utilizado

| Tecnología | Uso en PIPING | ¿Reutilizable en LukeAPP? |
|------------|---------------|---------------------------|
| **Dexie** (`dexie`, `dexie-react-hooks`) | Base de datos local offline (IndexedDB) | ✅ **SÍ** - Crítico para offline-first |
| **Zustand** | State management global | ✅ **SÍ** - Más ligero que Redux |
| **PapaParse** | Importación de CSV | ✅ **SÍ** - Para carga masiva de datos |
| **XLSX** | Importación/exportación Excel | ✅ **SÍ** - Ingeniería usa Excel |
| **@react-pdf/renderer** | Generación de PDFs | ✅ **SÍ** - Reportes e isométricos |
| **@ducanh2912/next-pwa** | PWA support | ✅ **SÍ** - Ya lo tenemos en plan |
| **Tailwind CSS** | Estilos | ❌ **NO** - LukeAPP usa Vanilla CSS |
| **Lucide React** | Iconos | ✅ **SÍ** - Librería moderna de iconos |

---

## 🗂️ Estructura de Datos de Ingeniería

### Tablas Identificadas (de `database/supabase-phase1-engineering.sql`)

```
📦 Engineering Data
├── isometrics (Isométricos)
├── spools (Spools)
├── welds (Soldaduras/Juntas)
├── impacts (Impactos de revisiones)
├── revisions (Revisiones de ingeniería)
├── engineering_details (Detalles técnicos)
└── test_packs (Paquetes de prueba)
```

### Tipos TypeScript Clave (de `src/types/engineering.ts`)

El archivo define las estructuras de datos para:
- **Isométricos**: Planos de piping
- **Spools**: Segmentos de tubería
- **Welds**: Juntas soldadas
- **Impacts**: Análisis de impacto de cambios
- **Revisions**: Control de revisiones

---

## 🎯 Componentes Reutilizables

### 1. **Carga Masiva de Datos**

**Archivos clave:**
- `src/components/engineering/EngineeringManager.tsx` (55KB!)
- `src/components/engineering/UploadEngineeringDetails.tsx`
- `src/components/personal/ImportCSVModal.tsx`
- `src/lib/utils/excel-parser.ts`

**Funcionalidad:**
- Importación de Excel/CSV
- Validación de datos
- Preview antes de importar
- Manejo de errores

**Recomendación**: Adaptar para LukeAPP manteniendo la lógica de validación.

---

### 2. **Gestión de Revisiones e Impactos**

**Archivos clave:**
- `src/services/revision-announcement.ts` (31KB)
- `src/services/impact-comparison.ts` (31KB)
- `src/components/engineering/ImpactVerificationView.tsx`

**Funcionalidad:**
- Comparación de revisiones (Rev A vs Rev B)
- Análisis de impacto en spools existentes
- Aprobación de migraciones

**Recomendación**: **CRÍTICO** - Este es el corazón de la Fase 2. Reutilizar la lógica de comparación.

---

### 3. **Offline Database (Dexie)**

**Archivos clave:**
- `src/lib/db/index.ts` (9.8KB)
- `src/lib/sync/SyncManager.ts` (39KB!)
- `src/lib/sync/RetryQueue.ts`
- `src/hooks/useOfflineData.ts`

**Funcionalidad:**
- Schema de Dexie para IndexedDB
- Sincronización bidireccional
- Cola de reintentos
- Manejo de conflictos

**Recomendación**: **REUTILIZAR COMPLETO** - Esta es la base del offline-first.

---

### 4. **Componentes de Ingeniería**

**Archivos clave:**
- `src/components/spools/SpoolPhaseModal.tsx` (25KB)
- `src/components/spools/LevantamientoModal.tsx` (43KB!)
- `src/components/welding/WeldDetailModal.tsx` (34KB)

**Funcionalidad:**
- Gestión de fases de spools
- Levantamientos con fotos
- Detalles de soldaduras

**Recomendación**: Adaptar para el nuevo diseño Vanilla CSS.

---

## 📋 Schema SQL Relevante

### Estructura de Ingeniería (Simplificada)

```sql
-- Isométricos (Planos)
CREATE TABLE isometrics (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  iso_number TEXT UNIQUE,
  revision TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
);

-- Spools (Segmentos de tubería)
CREATE TABLE spools (
  id UUID PRIMARY KEY,
  isometric_id UUID REFERENCES isometrics,
  spool_number TEXT UNIQUE,
  status TEXT,
  location TEXT,
  phase TEXT -- FABRICATION, WELDING, QA, INSTALLED
);

-- Welds (Juntas)
CREATE TABLE welds (
  id UUID PRIMARY KEY,
  spool_id UUID REFERENCES spools,
  weld_number TEXT,
  type TEXT,
  status TEXT,
  soldador_rut TEXT,
  executed_at TIMESTAMPTZ
);

-- Impacts (Análisis de cambios)
CREATE TABLE impacts (
  id UUID PRIMARY KEY,
  old_revision TEXT,
  new_revision TEXT,
  impact_type TEXT, -- NEW, MODIFIED, DELETED
  affected_spools JSONB
);
```

---

## 🔄 Flujo de Datos de Ingeniería (Descubierto)

```mermaid
graph TD
    A[Excel de Ingeniería] --> B[Upload Component]
    B --> C[Validación]
    C --> D[Preview]
    D --> E[Importar a Supabase]
    E --> F[Tabla: isometrics]
    E --> G[Tabla: spools]
    E --> H[Tabla: welds]
    
    I[Nueva Revisión] --> J[Impact Analysis]
    J --> K[Comparación Rev A vs B]
    K --> L[Identificar Cambios]
    L --> M[Aprobación]
    M --> N[Migración de Datos]
```

---

## 🚀 Recomendaciones para LukeAPP Fase 2

### Fase 2A: Carga de Datos de Ingeniería

**Objetivo**: Permitir que Oficina Técnica cargue información al sistema.

**Componentes a crear:**

1. **`/admin/proyecto/[id]/ingenieria`** (Ya existe stub)
   - Subir Excel de isométricos
   - Subir Excel de spools
   - Subir Excel de welds
   - Preview y validación

2. **Schema SQL** (Nuevo)
   ```sql
   -- Adaptar de supabase-phase1-engineering.sql
   -- Agregar project_id a todas las tablas
   -- Mantener RLS policies
   ```

3. **Servicios** (Adaptar de PIPING)
   - `src/services/engineering.ts`
   - `src/services/engineering-details.ts`
   - `src/lib/utils/excel-parser.ts`

4. **Componentes** (Adaptar a Vanilla CSS)
   - `EngineeringManager` → Gestor principal
   - `UploadEngineeringDetails` → Carga de Excel
   - `ImpactVerificationView` → Comparación de revisiones

---

### Fase 2B: Gestión de Revisiones

**Objetivo**: Manejar cambios de ingeniería (Rev A → Rev B).

**Funcionalidad clave:**
- Anuncio de nueva revisión
- Comparación automática
- Identificación de impactos
- Aprobación de cambios
- Migración de datos

**Reutilizar:**
- `revision-announcement.ts`
- `impact-comparison.ts`
- `impact-verification-schema.sql`

---

### Fase 2C: Offline Sync Engine

**Objetivo**: Preparar datos para consumo offline por apps de terreno.

**Reutilizar:**
- `SyncManager.ts` (completo)
- `RetryQueue.ts`
- `syncUtils.ts`
- Schema de Dexie

---

## 📦 Dependencias a Agregar

```json
{
  "dependencies": {
    "dexie": "^4.2.1",
    "dexie-react-hooks": "^4.2.0",
    "papaparse": "^5.5.3",
    "xlsx": "^0.18.5",
    "@react-pdf/renderer": "^4.3.1",
    "lucide-react": "^0.555.0",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@types/papaparse": "^5.5.1"
  }
}
```

---

## 🎨 Adaptación de UI

**Desafío**: PIPING usa Tailwind, LukeAPP usa Vanilla CSS.

**Estrategia**:
1. Mantener la lógica de negocio
2. Reescribir estilos con CSS Variables
3. Usar el design system existente de LukeAPP

**Ejemplo de conversión**:
```tsx
// PIPING (Tailwind)
<div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">

// LukeAPP (Vanilla CSS)
<div className="glass-panel">
```

---

## 📝 Archivos Clave para Revisar

### Prioridad Alta
1. `database/supabase-phase1-engineering.sql` - Schema completo
2. `src/types/engineering.ts` - Tipos TypeScript
3. `src/services/engineering.ts` - Lógica de negocio
4. `src/lib/sync/SyncManager.ts` - Motor de sincronización

### Prioridad Media
5. `src/components/engineering/EngineeringManager.tsx` - UI principal
6. `src/services/impact-comparison.ts` - Análisis de impactos
7. `src/lib/utils/excel-parser.ts` - Parser de Excel

### Prioridad Baja
8. Componentes de UI específicos (adaptar después)

---

## ⚠️ Advertencias

1. **No copiar Tailwind**: Toda la UI debe reescribirse con Vanilla CSS
2. **Validar multi-tenant**: El código anterior no era multi-tenant, agregar `project_id` a todo
3. **RLS Policies**: Asegurar que todas las tablas tengan políticas correctas
4. **Offline-first**: No todos los componentes estaban optimizados para offline

---

## ✅ Próximos Pasos Sugeridos

1. **Actualizar README.md** con Fase 2 corregida
2. **Crear schema SQL** adaptado de `supabase-phase1-engineering.sql`
3. **Instalar dependencias** (Dexie, XLSX, PapaParse, etc.)
4. **Adaptar tipos TypeScript** de `engineering.ts`
5. **Crear componente base** de carga de ingeniería
6. **Implementar parser de Excel** para isométricos

---

## 🔗 Enlaces Útiles

- **Repo anterior**: https://github.com/Crisvalpo/PIPING
- **Docs anteriores**: `piping-app/docs/`
- **Schema SQL**: `piping-app/database/`
- **Componentes**: `piping-app/src/components/engineering/`

---

**Conclusión**: El repositorio anterior tiene una base sólida de gestión de datos de ingeniería. La clave es **reutilizar la lógica de negocio y el schema**, pero **reescribir la UI** con Vanilla CSS y **agregar multi-tenancy** a todo.
