# 🎨 LukeAPP – Canvas Isométrico + IA Asistida

## Documento de Especificación Técnica para Desarrollo

> **Propósito del documento**
> Este documento define **de forma exhaustiva** el nuevo módulo *Canvas Isométrico Asistido por IA*, alineado 100% con la arquitectura, filosofía y principios de LukeAPP v3.

El objetivo no es crear un CAD, ni reemplazar ingeniería, sino **agregar valor operativo, comunicacional y generacional** mediante una herramienta visual + asistida.

---

## 🧠 1. Visión del Módulo

El *Canvas Isométrico* es un **entorno separado y seguro** donde un equipo de terreno puede:

* Dibujar modificaciones isométricas **2D controladas**
* Usar fittings simbólicos estandarizados
* Expresar intención técnica sin romper el modelo real
* Convertir esa intención en:
  * Vista 3D preliminar
  * Enlace web compartible
  * Documento PDF formal

### Principio Rector

> **El humano diseña la intención.**
> **La IA ordena, completa y valida.**
> **El sistema nunca inventa.**

---

## 🧩 2. Posición Arquitectónica (CRÍTICO)

El Canvas **NO ES**:

* ❌ Parte del visor 3D oficial
* ❌ Parte del pipeline de ingeniería
* ❌ Fuente de verdad

El Canvas **ES**:

* ✔️ Módulo experimental / de propuesta
* ✔️ Generador de eventos y artefactos
* ✔️ Herramienta de comunicación avanzada

### Ubicación en el sistema

```
LukeAPP
 ├─ Web Core (Verdad del proyecto)
 │    └─ Modelos GLB oficiales
 │
 ├─ Canvas Isométrico (Nuevo módulo)
 │    ├─ Dibujo 2D
 │    ├─ IA asistente
 │    ├─ Preview 3D
 │    └─ Publicación
 │
 └─ Revision / Approval System
```

---

## ✏️ 3. Canvas Isométrico – Diseño Funcional

### 3.1 Grilla Isométrica

* Ángulos fijos: 30° / 30° / Vertical
* Snap obligatorio
* Unidad base configurable (mm por grid)
* Zoom libre, paneo

### 3.2 Elementos Permitidos (V1)

#### A) Segmento recto (Pipe Run)

* Conecta dos nodos
* Dirección implícita: X / Y / Z

#### B) Fittings 2D simbólicos

| Fitting   | Semántica           | Parámetros mínimos |
| --------- | ------------------- | ------------------ |
| Elbow 90° | Cambio de dirección | Ángulo fijo        |
| Elbow 45° | Cambio suave        | Ángulo fijo        |
| Tee       | Derivación          | 3 puertos          |
| End       | Fin de línea        | 1 puerto           |

> ⚠️ El fitting **no es decoración**: es un nodo semántico.

---

## 🧠 4. Modelo de Datos del Dibujo (NO ES UN SVG)

El dibujo se representa internamente como un **grafo dirigido**.

### Entidades base

```ts
type IsoNode = {
  id: string
  position: { x: number; y: number; z: number }
  ports: number
}

type IsoEdge = {
  id: string
  from: string
  to: string
  length: number
  direction: 'X' | 'Y' | 'Z'
}

type IsoFitting = {
  id: string
  nodeId: string
  type: 'ELBOW_90' | 'ELBOW_45' | 'TEE' | 'END'
}
```

Este grafo es:

* Parseable
* Validable
* Serializable
* Base para IA

---

## 🤖 5. Rol del Chatbot (IA)

### 5.1 Qué **SÍ** hace la IA

* Interpreta intención geométrica
* Detecta información faltante
* Guía con preguntas técnicas
* Traduce conversación → JSON estructurado

### 5.2 Qué **NO** hace la IA

* ❌ Dibujar
* ❌ Inventar DN, material o ángulos
* ❌ Validar estándares
* ❌ Aplicar cambios reales

---

## 🧾 6. JSON Técnico Resultante

Ejemplo de salida IA:

```json
{
  "spoolName": "Spool-03 Modificado",
  "segments": [
    {"length": 500, "dn": "6\"", "material": "CS"}
  ],
  "fittings": [
    {"type": "ELBOW", "angle": 90}
  ],
  "author": "Juan Pérez",
  "reason": "Interferencia con soporte"
}
```

> ⚠️ Este JSON pasa SIEMPRE por validación dura (no IA).

---

## 🛑 7. Validación Industrial (Hard Rules)

* DN permitido por proyecto
* Ángulos estándar
* Compatibilidad de fittings
* Reglas de reducción

Implementación:

* TypeScript puro
* Sin IA
* Falla explícita y explicable

---

## 🧊 8. Preview 3D (Showroom)

* Three.js liviano
* Material neutro
* Solo rotar / zoom
* Read-only

> **Nunca editar aquí.**

---

## 🏷️ 9. Publicación de la Creación

### Metadata obligatoria

* Nombre (ej: *Spool-03 Modificado*)
* Autor
* Fecha
* Proyecto
* Estado: *Propuesta*

### Persistencia

* Supabase
* Tabla `canvas_proposals`

---

## 🔗 10. Compartición

### 10.1 Vista Web Pública

* URL única
* Sin login
* Read-only

Ejemplo:

```
https://spool.lukeapp.cl/share/MOD-2026-003
```

### 10.2 WhatsApp

Texto prearmado:

```
Spool-03 Modificado
Autor: Juan Pérez
Motivo: Interferencia

Ver modelo:
https://spool.lukeapp.cl/share/MOD-2026-003
```

---

## 📄 11. Exportación PDF

### Contenido estándar

1. Portada
2. Isométrico generado
3. Preview 3D (imagen)
4. Datos técnicos
5. Firma

Tecnología:

* Puppeteer / React-PDF
* Template fijo LukeAPP

---

## 🧭 12. Alcance Futuro del Chatbot

El chatbot **NO es exclusivo del Canvas**.

Puede extenderse a:

* Ayuda contextual en módulos
* Búsqueda semántica
* Explicación de estados
* Onboarding técnico

Principio:

> Un solo cerebro, múltiples contextos.

---

## 🚦 13. Estados del Cambio

| Estado    | Significado           |
| --------- | --------------------- |
| Draft     | En edición            |
| Propuesta | Compartida            |
| Revisada  | Vista por OT          |
| Aprobada  | Lista para ingeniería |
| Rechazada | Archivada             |

---

## 🧠 14. Principios Inquebrantables

* Separación de mundos
* IA asistente, no autora
* Offline-first compatible
* Evento > mutación
* Grafo > dibujo libre

---

## 🏁 Cierre

Este módulo no es una funcionalidad aislada.

Es una **pieza cultural**:

* Une generaciones
* Eleva conversaciones
* Reduce errores
* Da orgullo

**LukeAPP no solo gestiona piping.**
**Traduce conocimiento humano en ingeniería trazable.**
