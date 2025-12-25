# 📘 EVENT_CONTRACT_ENGINEERING.md

## 🧠 Propósito

Este documento define los contratos de eventos que representan los hechos ocurridos en el dominio de ingeniería (carga de datos, revisiones, impactos, y preparación de datos para terreno) antes de que existan apps offline.

Los eventos son la única forma válida de registrar acciones en este dominio, y serán usados luego por el sync engine para preparar datos que consumirán las apps de terreno.

---

## 📌 Convenciones de Eventos

- **Los eventos son inmutables.**
- **Los eventos no representan estados finales, sino hechos.**
- **Los eventos ocurren en un contexto específico:**
  - `company_id`
  - `project_id`
  - `performed_by`
  - `performed_at`
  - `schema_version`
- **Los eventos se pueden versionar**, para permitir evolución sin romper compatibilidad.

---

## 🧱 ESTRUCTURA GENERAL DE UN EVENTO

```json
{
  "event_id": "uuid",
  "event_type": "string",        // Nombre de evento en inglés
  "schema_version": "number",    // Version del contrato
  "tenant_id": "uuid",           // Empresa
  "project_id": "uuid",
  "entity_type": "string",       // por ejemplo: "engineering", "revision"
  "entity_id": "uuid",           // Id de entidad relacionada
  "performed_by": "uuid",        // Persona id
  "performed_at": "ISO8601",     // Timestamp de ocurrencia
  "payload": { /* JSON específico */ }
}
```

---

## 🧨 EVENTOS DEFINIDOS — FASE 2

### 📌 1. EngineeringDataUploaded

**Descripción:** Se cargan datos de ingeniería (isometrics, spools, welds).

```json
{
  "event_type": "EngineeringDataUploaded",
  "schema_version": 1,
  "payload": {
    "file_types": ["isometrics", "spools", "welds"],
    "counts": {
      "isometrics": 120,
      "spools": 4500,
      "welds": 9000
    }
  }
}
```

---

### 📌 2. EngineeringRevisionAnnounced

**Descripción:** Se anuncia una nueva revisión de ingeniería (por ejemplo Rev A → Rev B).

```json
{
  "event_type": "EngineeringRevisionAnnounced",
  "schema_version": 1,
  "payload": {
    "old_revision": "A",
    "new_revision": "B",
    "announced_at": "2025-12-20T15:30:00Z"
  }
}
```

---

### 📌 3. RevisionImpactAnalysisCompleted

**Descripción:** Se completó el análisis de impacto de una revisión.

```json
{
  "event_type": "RevisionImpactAnalysisCompleted",
  "schema_version": 1,
  "payload": {
    "old_revision": "A",
    "new_revision": "B",
    "impact_type": "NEW/MODIFIED/DELETED",
    "affected_entities": {
      "spools": ["uuid1", "uuid2"],
      "welds": ["uuid6"]
    }
  }
}
```

---

### 📌 4. EngineeringDataValidated

**Descripción:** Oficinia Técnica confirma que los datos cargados son válidos para proyecto.

```json
{
  "event_type": "EngineeringDataValidated",
  "schema_version": 1,
  "payload": {
    "validated_at": "2025-12-20T17:15:00Z",
    "validated_by": "uuid-ADMIN"
  }
}
```

---

### 📌 5. SnapshotForOfflinePrepared

**Descripción:** Se prepara un snapshot que consumirán las apps de terreno luego de sincronización.

```json
{
  "event_type": "SnapshotForOfflinePrepared",
  "schema_version": 1,
  "payload": {
    "generated_at": "2025-12-21T09:00:00Z",
    "data_version_tag": "v2-engineering"
  }
}
```

---

## 📌 REGLAS DE NEGOCIO DE LOS EVENTOS

### 🔹 Contexto obligatorio

Todo evento requiere explícitamente:

- `tenant_id` (empresa)
- `project_id`
- `performed_by` (usuario)
- `performed_at` (timestamp real)

### 🔹 Versionado de contratos

Cada evento tiene `schema_version` para permitir evolución del contrato sin romper aplicaciones ya sincronizadas.

### 🔹 Entidades vs Estados

- No se guardan estados finales directamente.
- Los eventos no contienen atributos como `status: "APPROVED"`; el estado se calcula por proyección en backend.

### 🔹 Integridad de datos

- Un evento debe tener un payload consistente.
- Si falta información crítica, el evento no se acepta en backend.

---

## 📌 BENEFICIOS ESPERADOS

**Consistencia en terreno**  
Las apps de terreno no asumen estructura de tabla; consumen eventos para construir su snapshot.

**Auditoría y trazabilidad**  
Todo cambio queda registrado como hecho (no sobrescrito).

**Separación de responsabilidades**  
La oficina técnica opera en línea; el terreno sincroniza y consume lo preparado.

---

## 📌 VERSIÓN INICIAL DEL CONTRATO

Este documento corresponde a la **Versión 1.0** del Event Contract para Ingeniería.

Las futuras versiones deben cumplir **retrocompatibilidad**.

---

## 🧭 QUÉ HACER LUEGO

1. Incluir este Event Contract en la documentación oficial del repo.
2. Preparar tests automatizados que aseguren que ningún código de backend genera eventos fuera del contrato.
3. Crear vistas o proyecciones en Supabase basadas en estos eventos.

---

## 📌 VISIBILIDAD

Este documento debe ser visible en el repo como:

- `/EVENT_CONTRACT_ENGINEERING.md`

o

- `/docs/EVENT_CONTRACT_ENGINEERING.md`
