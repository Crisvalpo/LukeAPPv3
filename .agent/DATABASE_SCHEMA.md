# Referencia del Esquema de Base de Datos: LukeAPP v3

Referencia completa de las estructuras de datos de Supabase / Postgres y políticas de seguridad.

---

## � Referencia Rápida de Tablas

### Schema `public` (Aplicación)

| Tabla | Descripción |
|---|---|
| `users` | Perfiles globales de usuario, sincronizados con `auth.users` |
| `companies` | Empresas clientes registradas en la plataforma |
| `subscription_plans` | Planes de suscripción disponibles (Free, Pro, Enterprise) |
| `roles` | Roles de sistema base (super_admin, founder, admin, supervisor, worker) |
| `company_roles` | Roles funcionales personalizados por empresa con permisos JSONB granulares |
| `members` | Vínculo central entre usuarios, empresas y proyectos con su rol asignado |
| `invitations` | Invitaciones de onboarding con token único para nuevos miembros |
| `specialties` | Catálogo de disciplinas técnicas (CIV, MEC, ELE, INS, TUB, etc.) |
| `project_specialties` | Especialidades habilitadas por proyecto |
| `projects` | Contratos/proyectos de construcción dentro de una empresa |
| `quota_strikes` | Registro de infracciones de cuota por empresa |
| `system_notifications` | Notificaciones del sistema para usuarios |
| `work_fronts` | Frentes de trabajo dentro de un proyecto |
| `locations` | Zonas físicas / CWA dentro de un proyecto |
| `areas` | Sub-áreas dentro de una location |
| `workshops` | Talleres de fabricación asociados a un proyecto |
| `workshop_deliveries` | Entregas de taller a terreno |
| `spools` | Spools de piping prefabricados (segmentos de tubería) |
| `spools_joints` | Juntas (joints) dentro de un spool |
| `spools_welds` | Soldaduras dentro de un spool |
| `spools_mto` | Material Take-Off asociado a spools |
| `weld_executions` | Ejecución de soldaduras con historial de migración |
| `pipe_sticks` | Tramos de tubería (pipe sticks) para corte |
| `pipe_cutting_orders` | Órdenes de corte de tubería |
| `material_catalog` | Catálogo maestro de materiales por proyecto (código + spec) |
| `material_take_off` | MTO vinculado a revisiones de ingeniería |
| `material_instances` | Instancias de material en isométricos (Excel: ISO, LINE, AREA, REV, SHEET) |
| `material_requests` | Requisiciones de material desde terreno |
| `material_request_items` | Ítems individuales de una requisición |
| `material_receipts` | Recepciones de material en bodega |
| `material_receipt_items` | Ítems individuales de una recepción |
| `material_inventory` | Inventario actual de materiales en bodega |
| `document_types` | Catálogo de tipos de documento por empresa (Plano, Procedimiento, Spec) |
| `project_document_config` | Configuración de codificación documental por proyecto |
| `document_master` | Registro maestro de documentos únicos por proyecto |
| `document_revisions` | Versiones de cada documento (DRAFT → APPROVED → SUPERSEDED) |
| `document_event_log` | Bitácora inmutable de eventos del ciclo de vida documental |
| `transmittals` | Entregas formales de lotes de documentos |
| `transmittal_items` | Ítems de revisión incluidos en un transmittal |
| `isometrics` | Isométricos de piping (planos de fabricación) |
| `engineering_revisions` | Revisiones de ingeniería de isométricos |
| `revision_events` | Log inmutable del ciclo de vida de revisiones (Event Sourcing) |
| `revision_impacts` | Impactos detectados de cambios de revisión en producción existente |

### Schema `auth` (Supabase Auth — Solo Lectura)

| Tabla | Descripción |
|---|---|
| `auth.users` | Usuarios autenticados. Fuente de verdad para identidad |
| `auth.sessions` | Sesiones activas de usuario |
| `auth.identities` | Proveedores de identidad (email, Google, etc.) |
| `auth.mfa_factors` | Factores MFA registrados por usuario |
| `auth.saml_providers` | Proveedores SAML para SSO empresarial |
| `auth.saml_relay_states` | Estados de relay SAML |
| `auth.sso_providers` | Proveedores SSO configurados |
| `auth.sso_domains` | Dominios de email mapeados a proveedores SSO |
| `auth.flow_state` | Estado de flujos OAuth en progreso |
| `auth.refresh_tokens` | Tokens de refresco de sesión |
| `auth.audit_log_entries` | Log de auditoría de eventos de autenticación |

### Schema `storage` (Supabase Storage — Solo Lectura)

| Tabla | Descripción |
|---|---|
| `storage.buckets` | Definición de buckets (ej: `project-files`) |
| `storage.objects` | Registro de todos los archivos almacenados. **No modificar directamente** |
| `storage.migrations` | Migraciones internas del schema de storage |
| `storage.s3_multipart_uploads` | Uploads multiparte en progreso |
| `storage.s3_multipart_uploads_parts` | Partes individuales de uploads multiparte |

---

## �🔐 1. Gestión de Identidad y Acceso

### `users`
Perfiles globales de usuario. Sincronizados con `auth.users`.
- **Llave Primaria**: `id` (uuid)
- **RLS**: Habilitado (Los usuarios pueden leer/editar su propio perfil).
- **Regla de Auditoría**: Las cuentas fantasma (Staff de LukeAPP) se ocultan de las listas.

### `company_roles`
Definiciones de roles funcionales (Capa B).
- **Columnas Core**: `name`, `color`, `base_role` (Rol de Sistema), `permissions` (JSONB).
- **Permisos**: Define acceso a módulos (ej: `procurement`) y acciones por recurso (view/create/delete).

### `members`
El núcleo relacional que vincula Usuarios con Empresas y Proyectos.
- **Restricciones**:
    - `super_admin`/`founder`: El Project ID debe ser NULL.
    - `admin`/`supervisor`/`worker`: El Project ID debe ser NOT NULL.
- **Política RLS**: El acceso está estrictamente limitado al `project_id` o `company_id` del usuario.

### `invitations`
Onboarding seguro basado en enlaces.
- **Llaves**: `email`, `token`, `role_id`, `primary_specialty_id`.
- **Lógica**: Al aceptar, el sistema crea/reactiva automáticamente un registro en `members`.

---

## 🏛️ 2. AWP y Jerarquía de Proyecto

### `projects`
Entidad que representa un contrato de construcción específico.
- **Llaves**: `company_id`, `name`, `code`.

### `specialties` (Especialidades)
Catálogo de disciplinas (CIV, MEC, ELE, etc.).
- **Uso**: Se vincula con `members.primary_specialty_id` para roles expertos.
- **Contexto Global**: Si un miembro no tiene especialidad asignada, se trata como "Global/TODAS" (ej: Project Manager, Expedidor).

### `locations` / `areas` (CWA)
Zonas físicas dentro de un proyecto.
- **Propósito**: Filtrado geográfico para todas las entidades.

---

## 📦 3. Materiales y Adquisiciones (Procurement)

### `material_catalog`
Registro maestro técnico de items.
- **Restricción Única**: `(project_id, ident_code, COALESCE(spec_code, ''))`.
- **Lógica**: Soporta múltiples especificaciones para el mismo código de identificación.
- **Rendimiento**: Cargadores masivos de alto rendimiento implementados en `material-catalog.ts`.

### `material_requests` y `request_items`
Requisiciones de terreno.
- **Flujo de Trabajo**: Draft -> Submitted -> Approved -> Fulfilled.
- **Auditoría**: Cada movimiento de inventario se vincula a un requerimiento o item.

---

## 🔧 4. Entidades Industriales (Multi-disciplina)

### `spools` (Piping/MEC)
Segmentos prefabricados.
- **Seguimiento**: Área, Sistema, Número de Línea, Revisión.

### `welds` (Soldaduras) y `joints` (Juntas)
Puntos de producción específicos dentro de un spool o estructura.
- **Historial**: Pistas de auditoría para cambios de estado (ej: `WELDED` -> `RT_READY`).
- **Calidad (QA)**: Pruebas fotográficas almacenadas en Supabase Storage.

---

## 📄 5. Control Documental (Document Control)

### `document_types`
Catálogo de tipos de documento por empresa (Plano, Procedimiento, Spec, etc.).
- **Restricción Única**: `(company_id, code)`.

### `project_document_config`
Configuración por proyecto: regla de codificación (`coding_pattern`), secuencia, y congelamiento.
- **Restricción Única**: `(project_id)`.

### `document_master`
Registro maestro de un documento único dentro de un proyecto.
- **Llaves**: `project_id`, `company_id`, `document_type_id`, `specialty_id`.
- **Restricción Única**: `(project_id, document_code)`.

### `document_revisions`
Versiones de cada documento. Flujo: `DRAFT → UNDER_REVIEW → APPROVED → SUPERSEDED`.
- **Restricción Única**: `(document_id, rev_code)`.

### `transmittals` y `transmittal_items`
Entregas formales de lotes de documentos. Cada transmittal contiene items que referencian revisiones.

### `document_event_log`
Bitácora inmutable de eventos (CREATED, REVISION_UPLOADED, STATUS_CHANGED, TRANSMITTED, FROZEN, UNFROZEN).
- **Inmutabilidad**: Solo INSERT, no permite UPDATE ni DELETE.

---

## 🛡️ 6. Arquitectura de Políticas RLS

### Protección contra Recursión
Para evitar `infinite recursion` al verificar permisos en la tabla `members`:
1. **Función Security Definer**: Crear `is_super_admin()` o `get_user_role()`.
2. **Política**: Usar la función en lugar de una subconsulta directa a la tabla.

### Patrones de Políticas
- **Acceso Propietario**: `auth.uid() = user_id`.
- **Acceso por Ámbito (Scope)**: `EXISTS (SELECT 1 FROM members WHERE project_id = current.project_id AND user_id = auth.uid())`.
- **Bypass de Founder**: Los founders ven todos los registros donde el `company_id` coincide.

---
**Este documento reemplaza al DATABASE_SCHEMA_REFERENCE.md de la raíz.**

---

## � 8. Disparadores (Triggers) del Sistema

El sistema tiene **24 triggers** distribuidos entre los schemas `auth`, `public` y `storage`.

### Auth Schema

| Trigger | Tabla | Evento | Timing | Función |
|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | INSERT | AFTER | `public.handle_new_user()` |

**`handle_new_user()`**: Crea automáticamente un registro en `public.users` cuando se registra un nuevo usuario en Auth.

---

### Public Schema

| Trigger | Tabla | Evento | Timing | Propósito |
|---|---|---|---|---|
| `set_updated_at` | `companies` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `projects` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `members` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `document_master` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `document_revisions` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `isometrics` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `engineering_revisions` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `transmittals` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `spools` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |
| `set_updated_at` | `welds` | UPDATE | BEFORE | Actualiza `updated_at` automáticamente |

---

### Storage Schema

| Trigger | Tabla | Evento | Timing | Función |
|---|---|---|---|---|
| `protect_objects_delete` | `storage.objects` | DELETE | BEFORE | `storage.protect_delete()` |
| `update_objects_updated_at` | `storage.objects` | UPDATE | BEFORE | `storage.update_updated_at_column()` |

> [!CAUTION]
> **`protect_objects_delete`**: Este trigger **bloquea CUALQUIER `DELETE` directo** en `storage.objects`. Lanza el error:
> ```
> ERROR: Direct deletion from storage tables is not allowed. Use the Storage API instead.
> HINT: This prevents accidental data loss from orphaned objects.
> ```
> La única forma de eliminar archivos es usando la **Storage API** (`supabase.storage.from('bucket').remove([paths])`).

> [!WARNING]
> El usuario `postgres` **no tiene ownership** de `storage.objects`, por lo que tampoco puede hacer `ALTER TABLE storage.objects DISABLE TRIGGER protect_objects_delete`. La Storage API es la única vía.

---

### Función `set_updated_at` (Patrón Común)

Todos los triggers de `updated_at` usan la misma función genérica:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🗂️ 7. Arquitectura de Storage (Supabase Storage)

### Bucket: `project-files`


Bucket **público** que almacena todos los archivos del proyecto.

#### Estructura de Rutas

```
project-files/
└── {company-slug}-{company-id}/          ← Carpeta de empresa
    ├── company/                           ← Archivos de empresa (logos, etc.)
    └── {project-code}-{project-id}/      ← Carpeta de proyecto
        ├── civil/
        ├── electrical/
        ├── instrumentation/
        ├── mechanical/
        ├── piping/
        │   ├── isometric-models/
        │   ├── isometric-pdfs/
        │   └── spools/
        ├── documents/
        │   ├── revisions/
        │   └── transmittals/
        ├── logos/
        ├── photos/
        └── structure-models/
```

> [!IMPORTANT]
> El `project-code` en la ruta de storage se guarda en **MAYÚSCULAS** (ej: `PDP-991b9aed`), ya que se usa `project.code.toUpperCase()` al crear el proyecto. Esto es crítico para la eliminación correcta de archivos.

#### Archivos `.keep`

Al crear un proyecto (`createProject`), se generan archivos `.keep` vacíos en cada subcarpeta para que existan en el bucket. Estos son archivos reales con `id` en la tabla `storage.objects`.

- **Tamaño**: 0 bytes
- **Mimetype**: `application/octet-stream`
- **Propósito**: Mantener la estructura de carpetas visible en el Studio

#### Lógica de Eliminación

La eliminación de storage se realiza **client-side** (desde el servicio TypeScript) antes de llamar al RPC de base de datos, porque:

1. El trigger `storage.protect_delete()` bloquea `DELETE` directo en `storage.objects`.
2. El usuario `postgres` no tiene ownership de la tabla para deshabilitar el trigger.
3. La Storage API de Supabase es la única vía permitida.

**Función recursiva en `projects.ts` y `companies.ts`:**
```typescript
const recursiveDelete = async (path: string): Promise<void> => {
    const { data: items } = await supabase.storage
        .from('project-files')
        .list(path, { limit: 100 })

    if (!items || items.length === 0) return

    const files: string[] = []
    const folders: string[] = []

    for (const item of items) {
        const fullPath = `${path}/${item.name}`
        if (item.id === null) {
            folders.push(fullPath) // prefijo virtual
        } else {
            files.push(fullPath)   // archivo real (incluye .keep)
        }
    }

    if (files.length > 0) {
        await supabase.storage.from('project-files').remove(files)
    }

    for (const folder of folders) {
        await recursiveDelete(folder)
    }
}
```

#### ⚠️ Gotchas Conocidos

| Problema | Causa | Solución |
|---|---|---|
| Carpetas huérfanas persisten | Archivos `.keep` con casing diferente (mayúsculas) no encontrados por `list()` | Usar rutas exactas de la DB o función recursiva |
| `DELETE FROM storage.objects` falla | Trigger `storage.protect_delete()` lo bloquea | Usar Storage API (`supabase.storage.remove()`) |
| `list()` no retorna `.keep` files | Bug de caché en Supabase Storage local | Intentar eliminar rutas conocidas directamente con `remove()` |
| Carpeta sigue visible tras eliminar archivos | Comportamiento normal — las carpetas son prefijos virtuales | Se actualiza al refrescar el Studio |

#### Script de Limpieza Manual

Para limpiar carpetas huérfanas, usar `scripts/force-delete-storage.js` con las rutas exactas obtenidas de la DB:

```sql
-- Obtener rutas exactas de objetos huérfanos
SELECT name FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND name LIKE 'empresa-de-prueba-%/%';
```

