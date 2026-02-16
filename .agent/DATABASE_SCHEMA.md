# Referencia del Esquema de Base de Datos: LukeAPP v3

Referencia completa de las estructuras de datos de Supabase / Postgres y políticas de seguridad.

---

## 🔐 1. Gestión de Identidad y Acceso

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

## 🛡️ 5. Arquitectura de Políticas RLS

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
