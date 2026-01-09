# 📋 Roadmap Pragmático - Canvas Isométrico

> **Filosofía**: Cada hito entrega valor real sin depender del siguiente.

---

## 🎯 Resumen Ejecutivo

| Hito | Duración | Complejidad | Valor Entregado |
|------|----------|-------------|-----------------|
| 1. Canvas 2D MVP | 2-3 sem | ⭐⭐⭐⭐ | Dibujar + Export JSON |
| 2. Metadata Manual | 1 sem | ⭐⭐ | Persistencia en BD |
| 3. Validación Hard-Coded | 1 sem | ⭐⭐⭐ | Calidad garantizada |
| 4. Preview 3D Básico | 2 sem | ⭐⭐⭐⭐ | Visualización 3D |
| 5. Compartir | 1 sem | ⭐⭐ | URLs públicas + WhatsApp |
| 6. IA Asistente | 3-4 sem | ⭐⭐⭐⭐⭐ | UX premium |

**Total**: 12-16 semanas

---

## 🏁 Hito 1: Canvas 2D MVP (2-3 semanas)

### ✅ Objetivos

Permitir a un usuario:
1. Abrir un canvas isométrico
2. Dibujar líneas rectas con snap a grilla
3. Colocar símbolos de fittings (íconos simples)
4. Borrar/mover elementos
5. Zoom y paneo
6. Exportar a JSON

### 🛠️ Stack Técnico

**Opción A: Fabric.js** (Recomendado para V1)
```bash
npm install fabric
```

**Opción B: Paper.js** (Mejor para geometría compleja)
```bash
npm install paper
```

**Opción C: Three.js en ortográfica** (Si quieres facilitar Hito 4)

### 📦 Entregable

```json
// proposal_draft.json
{
  "version": "1.0",
  "nodes": [
    {"id": "n1", "x": 0, "y": 0, "z": 0},
    {"id": "n2", "x": 500, "y": 0, "z": 0}
  ],
  "edges": [
    {"id": "e1", "from": "n1", "to": "n2", "direction": "X"}
  ],
  "fittings": [
    {"id": "f1", "nodeId": "n2", "type": "ELBOW_90"}
  ]
}
```

### ⚠️ Parte Más Difícil

**Grilla isométrica con snap perfecto** (40% del tiempo).

Tips:
- Usa transformación de matriz para rotar la grilla visual
- El snap debe ser en coordenadas del mundo, no del viewport
- Investiga `fabric.Canvas` con custom grid overlay

### ✅ Criterio de Éxito

Un operador puede dibujar una "L" (2 segmentos + 1 codo) en < 2 minutos.

---

## 🏁 Hito 2: Metadata Manual (1 semana)

### ✅ Objetivos

Completar el JSON con metadata técnica:
- DN de cada segmento
- Material
- Nombre del spool
- Razón del cambio
- Autor

### 🛠️ Implementación

Formulario React simple:

```tsx
export function ProposalMetadataForm({ graphData }: Props) {
  return (
    <form onSubmit={handleSave}>
      <input name="spoolName" placeholder="Nombre" required />
      <textarea name="reason" placeholder="Razón" required />
      
      {graphData.segments.map(seg => (
        <div key={seg.id}>
          <label>Segmento {seg.id}</label>
          <select name={`dn_${seg.id}`}>
            <option>2"</option>
            <option>4"</option>
            <option>6"</option>
          </select>
          <select name={`material_${seg.id}`}>
            <option>CS</option>
            <option>SS316</option>
          </select>
        </div>
      ))}
      
      <button type="submit">Guardar Propuesta</button>
    </form>
  )
}
```

### 📦 Base de Datos

```sql
-- Supabase Migration
CREATE TABLE canvas_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  spool_name TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  reason TEXT,
  graph_data JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE canvas_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals"
  ON canvas_proposals FOR SELECT
  USING (auth.uid() = author_id);
```

### ✅ Criterio de Éxito

Una propuesta guardada se persiste y puede recuperarse.

---

## 🏁 Hito 3: Validación Hard-Coded (1 semana)

### ✅ Objetivos

Validar que la propuesta cumple reglas industriales:
- DN permitidos por proyecto
- Ángulos estándar (45°, 90°)
- Compatibilidad de fittings
- Longitudes razonables

### 🛠️ Implementación

```typescript
// validators/industrial-rules.ts
export interface ProjectConfig {
  allowedDN: string[]
  allowedMaterials: string[]
  standardAngles: number[]
}

export function validateProposal(
  proposal: IsoProposal,
  config: ProjectConfig
): ValidationResult {
  const errors: string[] = []
  
  // Regla 1: DN permitidos
  proposal.segments.forEach(seg => {
    if (!config.allowedDN.includes(seg.dn)) {
      errors.push(`DN ${seg.dn} no permitido en segmento ${seg.id}`)
    }
  })
  
  // Regla 2: Ángulos estándar
  proposal.fittings.forEach(fit => {
    if (fit.type.includes('ELBOW') && 
        !config.standardAngles.includes(fit.angle)) {
      errors.push(`Ángulo ${fit.angle}° no estándar en ${fit.id}`)
    }
  })
  
  // Regla 3: Longitudes mínimas
  proposal.segments.forEach(seg => {
    if (seg.length < 50) { // 50mm mínimo
      errors.push(`Segmento ${seg.id} demasiado corto (${seg.length}mm)`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [] // Para validaciones "soft"
  }
}
```

### ✅ Criterio de Éxito

El sistema **rechaza** una propuesta con DN "10 inch" si solo se permiten hasta 6".

---

## 🏁 Hito 4: Preview 3D Básico (2 semanas)

### ✅ Objetivos

Generar geometría 3D desde el grafo 2D:
- Segmentos → cilindros
- Fittings → esferas (simplificado para V1)
- Cámara orbital
- Material neutro

### 🛠️ Implementación

```typescript
// generators/graph-to-3d.ts
import * as THREE from 'three'

export function graphToScene(graph: IsoGraph): THREE.Scene {
  const scene = new THREE.Scene()
  const material = new THREE.MeshStandardMaterial({ color: 0x888888 })
  
  // Generar cilindros por cada segmento
  graph.segments.forEach(seg => {
    const node1 = graph.nodes.find(n => n.id === seg.from)!
    const node2 = graph.nodes.find(n => n.id === seg.to)!
    
    const start = new THREE.Vector3(node1.x, node1.y, node1.z)
    const end = new THREE.Vector3(node2.x, node2.y, node2.z)
    const direction = end.clone().sub(start)
    const length = direction.length()
    
    const radius = parseDN(seg.dn) / 2 // DN a mm
    const geometry = new THREE.CylinderGeometry(radius, radius, length)
    const mesh = new THREE.Mesh(geometry, material)
    
    // Posicionar y rotar
    mesh.position.copy(start.clone().add(direction.multiplyScalar(0.5)))
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    )
    
    scene.add(mesh)
  })
  
  // Generar esferas por cada fitting (simplificado)
  graph.fittings.forEach(fit => {
    const node = graph.nodes.find(n => n.id === fit.nodeId)!
    const sphere = new THREE.SphereGeometry(50) // Radio fijo por ahora
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.set(node.x, node.y, node.z)
    scene.add(mesh)
  })
  
  return scene
}
```

### 📦 Componente React

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export function Preview3D({ graph }: { graph: IsoGraph }) {
  const scene = useMemo(() => graphToScene(graph), [graph])
  
  return (
    <Canvas camera={{ position: [1000, 1000, 1000], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <primitive object={scene} />
      <OrbitControls />
    </Canvas>
  )
}
```

### ⚠️ Parte Más Difícil

**Mapeo correcto de coordenadas 2D isométricas → 3D real** (60% del tiempo).

La proyección isométrica no es una simple rotación 45°. Requiere matriz de transformación.

### ✅ Criterio de Éxito

El preview 3D muestra claramente la "L" dibujada en 2D.

---

## 🏁 Hito 5: Compartir (1 semana)

### ✅ Objetivos

- Generar URL pública para cada propuesta
- Vista read-only sin login
- Botón compartir por WhatsApp

### 🛠️ Implementación

```tsx
// app/share/[proposalId]/page.tsx
export default async function ShareProposal({
  params
}: {
  params: { proposalId: string }
}) {
  const { data: proposal } = await supabase
    .from('canvas_proposals')
    .select('*')
    .eq('id', params.proposalId)
    .single()
  
  if (!proposal) return <NotFound />
  
  return (
    <div>
      <h1>{proposal.spool_name}</h1>
      <p>Por: {proposal.author_name}</p>
      <p>Razón: {proposal.reason}</p>
      
      <Preview3D graph={proposal.graph_data} />
      
      <button onClick={() => shareWhatsApp(proposal)}>
        Compartir por WhatsApp
      </button>
    </div>
  )
}

function shareWhatsApp(proposal: Proposal) {
  const url = `${window.location.origin}/share/${proposal.id}`
  const text = `
Propuesta: ${proposal.spool_name}
Autor: ${proposal.author_name}
Razón: ${proposal.reason}

Ver modelo 3D: ${url}
  `.trim()
  
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
}
```

### 📦 RLS para URLs públicas

```sql
CREATE POLICY "Public proposals are readable"
  ON canvas_proposals FOR SELECT
  USING (status IN ('propuesta', 'revisada', 'aprobada'));
```

### ✅ Criterio de Éxito

Un supervisor puede abrir el link en su celular y ver el 3D sin login.

---

## 🏁 Hito 6: IA Asistente (3-4 semanas)

### ✅ Objetivos

Reemplazar el formulario manual con conversación IA:
- IA pregunta qué falta
- Detecta ambigüedades
- Sugiere valores comunes
- Nunca inventa

### 🛠️ Implementación

```typescript
// services/ai-assistant.ts
export async function interpretIntent(
  userMessage: string,
  currentGraph: IsoGraph,
  projectContext: ProjectConfig
): Promise<AssistantResponse> {
  const systemPrompt = `
Eres un asistente técnico de piping para LukeAPP.
Tu trabajo es ayudar a completar metadata de propuestas de spools.

CONTEXTO DEL PROYECTO:
- DN permitidos: ${projectContext.allowedDN.join(', ')}
- Materiales: ${projectContext.allowedMaterials.join(', ')}

ESTADO ACTUAL DEL DIBUJO:
${JSON.stringify(currentGraph, null, 2)}

REGLAS INQUEBRANTABLES:
1. NUNCA inventes valores (DN, materiales, ángulos)
2. Si falta información, pregunta UNA cosa específica
3. Ofrece opciones válidas del proyecto
4. Si algo es ambiguo, pide clarificación

FORMATO DE RESPUESTA (JSON):
{
  "question": "string", // La pregunta al usuario
  "suggestions": ["opt1", "opt2"], // Opciones válidas
  "missingFields": ["field1"], // Qué falta
  "isComplete": boolean // ¿Ya está todo?
}
  `
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### 📦 UI del Chat

```tsx
export function AIAssistantPanel({ graph }: { graph: IsoGraph }) {
  const [messages, setMessages] = useState<Message[]>([])
  
  async function sendMessage(text: string) {
    const response = await interpretIntent(text, graph, projectConfig)
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: response.question, suggestions: response.suggestions }
    ])
  }
  
  return (
    <div className="chat-panel">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
      <input onSubmit={sendMessage} />
    </div>
  )
}
```

### ⚠️ Parte Más Difícil

**Prompts que no alucinen** (70% del tiempo).

Requiere:
- Iteración constante
- Testing con casos reales
- Few-shot examples en el prompt
- Validación post-IA (jamás confíes ciegamente)

### ✅ Criterio de Éxito

La IA completa metadata en máximo 3 preguntas por propuesta.

---

## 🔄 Orden Recomendado de Implementación

```
Arrancar:     Hito 1 (CRÍTICO - si falla, todo falla)
       ↓
      Hito 2 (fácil, te da persistencia)
       ↓
      Hito 4 (genera WOW, sáltate 3 por ahora)
       ↓
      Hito 5 (valor de negocio inmediato)
       ↓
      Hito 3 (ahora sabes qué validar de verdad)
       ↓
      Hito 6 (el cherry on top)
```

---

## 📊 Métricas de Progreso

| Hito | Métrica de Éxito |
|------|------------------|
| 1 | Usuario dibuja "L" en < 2 min |
| 2 | Propuesta persiste y recupera |
| 3 | Rechaza DN inválido |
| 4 | Preview 3D reconocible |
| 5 | Supervisor abre link sin login |
| 6 | Metadata completa en ≤ 3 preguntas |

---

## 🚨 Red Flags (Cuándo Abortar)

Detente si:
- ❌ Hito 1 toma > 4 semanas (el canvas es inalcanzable)
- ❌ Usuarios reales no entienden la interfaz
- ❌ IA alucina en > 30% de casos (no es confiable)
- ❌ El equipo pierde motivación (scope creep)

---

¡Buena suerte! 🚀
