# Visión del Proyecto: LukeAPP v3

**Plataforma de Gestión de Construcción Industrial Multi-disciplina (AWP)**

LukeAPP es un sistema empresarial de alto rendimiento, multi-tenant, diseñado para la gestión integral de proyectos de construcción industrial a gran escala. Aunque se originó con un enfoque en Piping (cañerías), ha evolucionado hacia una plataforma completa que soporta todas las disciplinas industriales mediante los principios de **Advanced Work Packaging (AWP)**.

---

## 🏗️ Filosofía Core

### 1. Multi-disciplina e Integración
El sistema está diseñado para gestionar la complejidad de las plantas industriales integrando diferentes disciplinas en una única fuente de verdad:
- **CIV**: Obras Civiles (Fundaciones, estructuras)
- **ARC**: Arquitectura (Edificios, terminaciones)
- **MEC / PI**: Mecánica y Piping (Equipos, spools de cañería, soldadura)
- **ELE**: Electricidad (Escalerillas, cableado, conexionado)
- **INS / INST**: Instrumentación y Control

### 2. Jerarquía AWP (Advanced Work Packaging)
LukeAPP organiza la ejecución del proyecto en unidades geográficas y funcionales para reducir los silos en terreno:
- **CWA (Construction Work Area)**: Grandes divisiones geográficas del proyecto.
- **CWP (Construction Work Package)**: Paquetes específicos por disciplina dentro de una CWA.
- **IWP (Installation Work Package)**: La unidad mínima ejecutable en terreno (ej: un conjunto específico de spools o una fundación).

### 3. Identidad Basada en Contexto
> **"Una persona no es un usuario hasta que actúa dentro de un contexto."**

La plataforma impone que cada acción del usuario esté ligada a un **Inquilino (Empresa)** y un **Contexto (Proyecto + Rol)** específicos. El acceso se otorga exclusivamente mediante invitaciones formales, garantizando una estricta auditabilidad y seguridad.

---

## 🗺️ Hoja de Ruta y Fases Objetivo

### ✅ FASE 1: Fundación e Identidad (Core)
- **Infraestructura**: Next.js 15+, Supabase (Postgres/Auth/RLS), Tailwind CSS v4.
- **Multi-tenant**: CRUD de Empresas y Proyectos con aislamiento de datos.
- **Identidad**: Sistema de Roles de doble capa (Sistema vs Funcional).
- **Lobby**: Hall de entrada obligatorio al proyecto para confirmar contexto e identidad profesional.

### ✅ FASE 2: Ingeniería y Multi-disciplina (AWP)
- **Estructura de Proyecto**: Gestión de Áreas (CWA) y Frentes de Trabajo (IWP).
- **Catálogo de Especialidades**: Soporte para múltiples disciplinas (CIV, PI, ELE, etc.).
- **Revisiones Inteligentes**: Seguimiento basado en eventos de cambios de ingeniería.
- **Análisis de Impacto**: Detección automática de conflictos entre disciplinas.

### 🔄 FASE 3: Adquisiciones y Materiales (Foco Actual)
- **Catálogo Universal de Materiales**: Manejo de especificaciones técnicas para todas las disciplinas.
- **Cargadores Masivos**: Ingesta de datos de alto rendimiento y validada.
- **Inventario y Requerimientos**: Seguimiento de requisiciones de terreno y movimientos de stock.

### 🔄 FASE 4: Visualización y Modelado
- **Core del Visor 3D**: Coloreado de estado visual (BIM Integrado).
- **Mapeo**: Vinculación de entidades de la base de datos con elementos del modelo 3D.
- **Visualización de Progreso**: Visualización de la preparación de IWPs y completitud en terreno.

### 🚧 FASE 5: Ejecución en Terreno (Satélites Offline-First)
- **Satélites Móviles**: Aplicaciones PWA dedicadas para trabajadores de terreno.
- **Actualizaciones Basadas en Eventos**: Los trabajadores emiten eventos (ej: `SPOOL_WELDED`, `FOUNDATION_POURED`) en lugar de mutaciones directas a la DB.
- **Offline-First**: Operación continua en entornos con conectividad nula.

---

## 🧾 Las "Reglas de Oro" de LukeAPP

1. **Escalabilidad**: Cada funcionalidad debe funcionar para 1 empresa o 100, para 1 proyecto o 50.
2. **Online vs Offline**: Web Core es para gestión (Online); Satélites de Terreno son para ejecución (Offline-first). No compartir lógica de ejecución entre ellos.
3. **Sin Suposiciones de Sincronización**: El sistema debe tolerar la sincronización retrasada de eventos de terreno.
4. **La Visibilidad se Gana**: Ningún usuario ve datos sin un contexto confirmado (Proyecto + Rol).
5. **Derivar, No Diseñar**: Las vistas de la interfaz deben derivarse del dominio de datos y los roles, manteniendo una experiencia de usuario (UX) consistente y predecible.

---
**Privado - Todos los derechos reservados © 2026**
