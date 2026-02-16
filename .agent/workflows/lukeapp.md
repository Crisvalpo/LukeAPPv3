---
description: REGLAS DEL ESPACIO DE TRABAJO (LukeAPP)
---

# Reglas y Contexto del Espacio de Trabajo de LukeAPP

Estas reglas son autoritativas para todo el desarrollo asistido por IA.

## 🎯 PILARES ARQUITECTÓNICOS (CRÍTICOS)

### 1. AWP Multi-disciplina (Advanced Work Packaging)
- **Visión**: LukeAPP es una plataforma multi-disciplina (CIV, MEC/PI, ELE, INST).
- **Unidades Core**: Organizar el trabajo en torno a **CWA (Áreas)** e **IWP (Frentes de Trabajo)**.
- **Objetivo**: Gestión integral de construcción industrial, yendo más allá del enfoque único en Piping.

### 2. Identidad de Doble Capa (Nuevo Estándar)
- **Capa A: Rol de Sistema (Seguridad)**: `admin`, `supervisor`, `worker`. Fijo, controla RLS.
- **Capa B: Rol Funcional (UX)**: Personalizable (ej: "Expedidor", "Jefe OT"). Controla UI/Enrutamiento.
- **Restricción**: Un usuario DEBE tener un Rol de Sistema para existir en los datos; el Rol Funcional es para la experiencia.

### 3. Web Core Online vs Satélites de Terreno Offline
- **Web Core (lukeapp.me)**: Requiere conexión. Gestión e Ingeniería. Next.js + Tailwind v4.
- **Satélites de Terreno (field.lukeapp.me)**: Offline-first. Ejecución en terreno. PWA + Tailwind.
- **Sincronización**: La ejecución ocurre en los Satélites vía **Eventos**. El Web Core agrega y refleja el estado.

---

## 🎨 SISTEMA DE DISEÑO Y ESTILOS (Tailwind CSS v4)

### 1. Elección Estándar
- **Definitivo**: Tailwind CSS v4 es el estándar para todo el layout y utilidades.
- **Tokens de Tema**: La autoridad para colores, radios y espaciado son las variables CSS en `src/styles/design-system.css`.

### 2. Mapeo de UI (Iconos y Tipografía)
- **Iconos**: Usar el mapeo en `src/components/ui/Icons.ts`. NUNCA importar de `lucide-react` directamente.
- **Tipografía**: Usar `<Heading>` y `<Text>` de `src/components/ui/Typography.tsx`.

---

## 💻 HIGIENE DE DESARROLLO

### 1. Estándar de Idioma (ESTRICTO)
- **Backend/DB/Lógica**: Inglés.
- **UI/Etiquetas/Mensajes**: Español.

### 2. Aislamiento de la Capa de Servicio
- **Regla**: Los componentes NO DEBEN llamar a Supabase directamente. Toda la lógica en `src/services/`.

### 3. RLS y Seguridad
- **Regla**: Nunca omitir el RLS en el código de la aplicación.
- **SQL**: Usar funciones `SECURITY DEFINER` para romper bucles de recursión en las políticas de la tabla `members`.

---

## 📁 DOCUMENTACIÓN CORE (Legible para Humanos)
- [**Visión del Proyecto**](../PROJECT_VISION.md): Misión, alcance multi-disciplina y hoja de ruta.
- [**Arquitectura**](../ARCHITECTURE.md): Profundización en patrones técnicos.
- [**Estándares de Desarrollo**](../DEVELOPMENT_STANDARDS.md): Guía detallada de codificación y estilo.
- [**Esquema de Base de Datos**](../DATABASE_SCHEMA.md): Referencia completa de datos.

---
**Última Actualización**: Febrero 2026
**Contexto**: Transformación AWP Multi-disciplina