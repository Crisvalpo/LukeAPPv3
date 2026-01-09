# 🎨 Canvas Isométrico + IA Asistida

> **Estado**: 📦 En Backlog - Esperando equipo  
> **Prioridad**: Alta (Diferenciador competitivo)  
> **Complejidad**: Alta  
> **Tiempo Estimado**: 12-16 semanas (6 hitos)

---

## 📋 ¿Qué es este proyecto?

Un módulo **separado y experimental** que permite a equipos de terreno:
- Dibujar modificaciones isométricas en 2D
- Asistencia con IA para completar metadata técnica
- Generar preview 3D preliminar
- Compartir propuestas vía web/WhatsApp/PDF

**NO es un CAD**. Es una herramienta de comunicación técnica asistida.

---

## 🎯 Visión y Principios

### Regla de Oro
> **El humano diseña la intención.**  
> **La IA ordena, completa y valida.**  
> **El sistema nunca inventa.**

### Posición Arquitectónica

El Canvas **NO ES**:
- ❌ Parte del visor 3D oficial
- ❌ Fuente de verdad del proyecto
- ❌ Reemplazo de ingeniería

El Canvas **ES**:
- ✔️ Módulo experimental de propuestas
- ✔️ Herramienta de comunicación avanzada
- ✔️ Generador de artefactos compartibles

---

## 📚 Documentación Completa

Antes de empezar, lee en orden:

1. **[ESPECIFICACION_TECNICA.md](./ESPECIFICACION_TECNICA.md)** - Documento maestro con toda la visión
2. **[ROADMAP.md](./ROADMAP.md)** - 6 hitos pragmáticos y viables
3. **[ARQUITECTURA.md](./ARQUITECTURA.md)** - Cómo modularizar (independiente de Next.js)
4. **[PROTO_QUICKSTART.md](./PROTO_QUICKSTART.md)** - Cómo hacer el prototipo en 2 días

---

## 🚀 Primeros Pasos (Para Nuevo Desarrollador)

### Pre-requisitos
- Leer la especificación completa (1 hora)
- Entender vectores 3D básicos
- Familiaridad con Canvas 2D (Fabric.js/Paper.js)
- Acceso a OpenAI API (solo Hito 6)

### Validación de Viabilidad (2 días)
Antes de arrancar formalmente, hacer:

```bash
cd .future-implementations/canvas-isometrico/prototypes
npm create vite@latest canvas-proto -- --template react-ts
cd canvas-proto
npm install fabric
```

**Objetivo**: Dibujar 3 líneas con snap a grilla isométrica y exportar JSON.

Si logras esto en 2 días, el proyecto es viable.

---

## 📦 Hitos Utilizables (Cada uno entrega valor)

| # | Hito | Duración | Entregable |
|---|------|----------|------------|
| 1 | Canvas 2D MVP | 2-3 sem | Dibujar + Export JSON |
| 2 | Metadata Manual | 1 sem | Formularios + Supabase |
| 3 | Validación Hard-Coded | 1 sem | Reglas industriales |
| 4 | Preview 3D Básico | 2 sem | Three.js simple |
| 5 | Compartir | 1 sem | URLs públicas + WhatsApp |
| 6 | IA Asistente | 3-4 sem | Chatbot conversacional |

**Orden recomendado**: 1 → 2 → 4 → 5 → 3 → 6

---

## ⚠️ Riesgos Conocidos

1. **Complejidad del Canvas Isométrico**: No reinventar. Usar Fabric.js o Paper.js.
2. **IA que alucina**: Implementar guardrails estrictos. La IA pregunta, no decide.
3. **Mapeo 2D→3D**: Requiere geometría computacional. Considerar Three.js desde inicio.
4. **Scope Creep**: Resistir tentación de añadir features. Seguir roadmap.

---

## 🧑‍💻 Equipo Ideal

- **1 Dev Frontend Senior** (Canvas 2D + Three.js)
- **1 Dev Fullstack** (Next.js + Supabase + IA)
- **1 Product Owner** (con conocimientos de piping)
- **1 Tester de Campo** (operador real)

**Mínimo viable**: 2 devs + 1 tester.

---

## 📞 Contacto

**Responsable del Proyecto**: [Tu Nombre]  
**Documentación Original**: 2026-01-09  
**Última Actualización**: 2026-01-09

---

## 🏁 Cómo Retomar esto Después

1. Lee `ESPECIFICACION_TECNICA.md` (30 min)
2. Lee `ROADMAP.md` (15 min)
3. Haz el prototipo de validación (2 días)
4. Si funciona, arranca Hito 1 formalmente
5. Actualiza este README con tu progreso

**No arranques sin validar el prototipo primero.**

---

## 📈 Métricas de Éxito

Sabremos que funciona cuando:
- [ ] Un operador puede dibujar una modificación en < 5 minutos
- [ ] La IA completa metadata en < 3 preguntas
- [ ] El preview 3D es "suficientemente representativo"
- [ ] Se comparten al menos 5 propuestas/semana vía WhatsApp
- [ ] 80% de propuestas pasan validación industrial

---

¡Suerte, futuro desarrollador! 🚀
