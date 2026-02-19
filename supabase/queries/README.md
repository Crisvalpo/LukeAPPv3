# Supabase SQL Scripts Organization

Este directorio contiene scripts SQL auxiliares que NO son migraciones de estructura (DDL), sino herramientas de mantenimiento, diagnóstico y corrección de datos.

## Estructura de Carpetas

### `diagnostics/`
Scripts de solo lectura para verificar el estado de la base de datos.
- `CHECK_...`: Validaciones rápidas de integridad.
- `DIAG_...`, `DIAGNOSTIC_...`: Consultas profundas para encontrar errores.
- `VERIFY_...`: Scripts de verificación post-migración.

### `fixes/`
Scripts para corregir datos inválidos o parches de emergencia que no cambian la estructura base.
- `FIX_...`: Correcciones de lógica o datos.
- `RESTORE_...`: Scripts de recuperación.
- `MANUAL_FIX_...`: Parches aplicados manualmente.

### `maintenance/`
Scripts destructivos o de limpieza para entornos de desarrollo.
- `CLEAN_...`, `RESET_...`: Borrado de datos de prueba.
- `DELETE_...`: Eliminación de registros específicos.

### `seeds/`
Scripts para poblar la base de datos con datos iniciales o de prueba.
- `SEED_...`: Datos semilla (roles, usuarios admin, catálogos).
- `GENERATE_...`: Generadores de datos de prueba.

### `setup/`
Scripts de configuración inicial o manual que no entran en el flujo de migraciones automático.
- `FULL_DATABASE_SETUP.sql`: Script consolidado para restaurar la DB desde cero (Golden Master).

---

**Nota**: Las migraciones reales de estructura (Tablas, Columnas, Políticas RLS permanentes) deben ir siempre en `../migrations`.
