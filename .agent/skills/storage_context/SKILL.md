---
description: Contexto técnico y operativo sobre Supabase Storage (Bucket: project-files) en LukeAPP.
---

# Supabase Storage Context (Skill)

Este documento es la fuente de verdad para la gestión de archivos en el bucket `project-files` de LukeAPP.

## 1. Estructura de Carpetas

La estructura debe ser **estrictamente jerárquica** y limpia, basada en identificadores legibles (Slugs/Códigos).

### Patrón General
`/{company_slug}/{project_code}/{module_folder}/{...}`

### Módulos Específicos

#### Transmittals (Control Documental)
Archivos adjuntos a envíos y recepciones.
- **Entrantes**: `/{company_slug}/{project_code}/transmittals/INCOMING/{timestamp}_{filename}`
- **Salientes**: `/{company_slug}/{project_code}/transmittals/OUTGOING/{timestamp}_{filename}`

#### Revisiones de Documentos (Ingeniería)
Archivos técnicos versionados.
- **Ruta**: `/{company_slug}/{project_code}/documents/revisions/{document_code}/{rev_code}_{filename}`

---

## 2. Lógica de Generación de Rutas

Toda la lógica de rutas está centralizada en `src/lib/storage-paths.ts`.
**NO CONSTRUIR RUTAS MANUALMENTE EN COMPONENTES.**

### Funciones Clave
- `getProjectStoragePath(company, project)`: Retorna `company.slug/project.code`.
- `getDocumentRevisionStoragePath(...)`: Retorna la ruta completa para una revisión.

**Sanitización**:
- Los nombres de archivo se deben sanitizar: `filename.replace(/[^a-zA-Z0-9.-]/g, '_')`.
- Los slugs de empresa y códigos de proyecto deben ser limpios (sin UUIDs adjuntos).

---

## 3. Seguridad (Row Level Security - RLS)

El bucket `project-files` es **Público** para lectura, pero restringido para escritura.

### Políticas Actuales (SQL)
Las políticas se definen en `storage.objects`.

1.  **Lectura (SELECT)**:
    - Pública (`bucket_id = 'project-files'`).
    - Permitido para cualquier usuario autenticado o anónimo (si el bucket es público).

2.  **Escritura (INSERT)**:
    - Solo usuarios autenticados (`auth.role() = 'authenticated'`).
    - Requiere que el usuario pertenezca a la empresa asociada a la carpeta raíz (`company_slug`).
    - *Nota: Actualmente la validación de pertenencia es permisiva para facilitar desarrollo, pero idealmente verifica `profile_companies`.*

3.  **Modificación/Borrado (UPDATE/DELETE)**:
    - Solo usuarios autenticados.
    - Generalmente restringido al creador del objeto (`owner = auth.uid()`) o admins.

### Errores Comunes de RLS
- **Error**: `new row violates row-level security policy`
- **Causa**: El usuario intenta subir un archivo a una ruta que no coincide con la política (ej. subir a una empresa a la que no pertenece, o path mal formado).
- **Solución**: Verificar que `company_id` y `project_id` en el frontend coincidan con los permisos del usuario y que la ruta use el `company_slug` correcto.

---

## 4. Mantenimiento y Limpieza

### Auditoría
- Revisar periódicamente que no existan carpetas huérfanas o con nombres sucios (UUIDs).
- Usar el script `clean_storage_audit.sql` (si existe) o consultas a `storage.objects` para listar rutas atípicas.

### Borrado Lógico vs. Físico
- Al eliminar un registro (ej. Transmittal), se debe decidir si eliminar el archivo físico.
- **Política Actual**: Los archivos se mantienen por seguridad (backup) a menos que se solicite explícitamente su purga. El borrado en BD no implica borrado en Storage automático (salvo disparadores específicos).

