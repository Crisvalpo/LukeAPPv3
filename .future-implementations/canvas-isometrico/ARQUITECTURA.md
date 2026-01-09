# 🧩 Arquitectura Modular - Canvas Isométrico

> **Objetivo**: Que el Canvas sea independiente de Next.js y reutilizable.

---

## 🎯 Filosofía

El Canvas **NO debe estar acoplado** a:
- Next.js
- Supabase
- React (idealmente)

Debe ser un **motor standalone** que se pueda usar en:
- Web (React)
- Desktop (Electron)
- Tablet (React Native)
- CLI (Node.js para testing)

---

## 🏗️ Arquitectura de 3 Capas

```
┌──────────────────────────────────────────┐
│  LAYER 1: Canvas Engine (Standalone)     │
│  - Grilla isométrica                     │
│  - Grafo de geometría                    │
│  - Validación topológica                 │
│  - Export/Import JSON                    │
│  📦 npm: @lukeapp/iso-canvas-engine      │
└──────────────────────────────────────────┘
               ↓ (consume)
┌──────────────────────────────────────────┐
│  LAYER 2: AI Orchestrator (Standalone)   │
│  - Parser de intención                   │
│  - Validación industrial                 │
│  - Estado de conversación                │
│  📦 npm: @lukeapp/iso-ai-assistant       │
└──────────────────────────────────────────┘
               ↓ (consume)
┌──────────────────────────────────────────┐
│  LAYER 3: Web Integration (Next.js)      │
│  - UI/UX específico                      │
│  - Supabase persistence                  │
│  - 3D Preview (Three.js)                 │
│  - PDF Export                            │
│  📁 src/modules/canvas-isometrico/       │
└──────────────────────────────────────────┘
```

---

## 📦 Layer 1: Canvas Engine

### Responsabilidades

- Modelo de datos (grafo)
- Geometría isométrica
- Validación topológica
- Serialización JSON

### API Pública

```typescript
// core/IsoCanvasEngine.ts
export class IsoCanvasEngine {
  private graph: IsoGraph
  private grid: GridSystem
  private validator: TopologyValidator
  
  constructor(config: CanvasConfig) {
    this.grid = new GridSystem(config.gridSize, config.angles)
    this.graph = new IsoGraph()
    this.validator = new TopologyValidator()
  }
  
  // Operaciones CRUD
  addNode(position: Vector3): NodeId
  addEdge(from: NodeId, to: NodeId): EdgeId
  removeNode(nodeId: NodeId): void
  moveNode(nodeId: NodeId, newPos: Vector3): void
  
  // Validación
  validate(): ValidationResult
  
  // Serialización
  exportJSON(): IsoGraphJSON
  importJSON(json: IsoGraphJSON): void
  
  // State
  undo(): void
  redo(): void
  getState(): EngineState
}
```

### Estructura del Paquete

```
packages/
  iso-canvas-engine/
    ├─ src/
    │   ├─ core/
    │   │   ├─ IsoCanvasEngine.ts
    │   │   ├─ IsoGraph.ts
    │   │   └─ GridSystem.ts
    │   ├─ validators/
    │   │   └─ TopologyValidator.ts
    │   ├─ types/
    │   │   └─ index.ts
    │   └─ index.ts
    ├─ tests/
    │   └─ IsoCanvasEngine.test.ts
    ├─ package.json
    └─ tsconfig.json
```

### Sin Dependencias de UI

```json
// package.json
{
  "name": "@lukeapp/iso-canvas-engine",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    // Solo matemáticas, sin React/DOM
  }
}
```

---

## 🤖 Layer 2: AI Orchestrator

### Responsabilidades

- Interpretar intención del usuario
- Validar contra reglas industriales
- Gestionar contexto de conversación
- Generar JSON estructurado

### API Pública

```typescript
// core/IsoAIAssistant.ts
export class IsoAIAssistant {
  constructor(
    private llm: LLMProvider,
    private projectContext: ProjectConfig
  ) {}
  
  async interpretIntent(
    userMessage: string,
    currentGraph: IsoGraph
  ): Promise<AssistantResponse> {
    // Analiza mensaje + grafo
    // Retorna pregunta o validación
  }
  
  async validateIndustrial(
    proposal: IsoProposal
  ): Promise<ValidationResult> {
    // Reglas hard-coded (sin LLM)
  }
  
  async completeMetadata(
    partialProposal: Partial<IsoProposal>,
    conversation: Message[]
  ): Promise<IsoProposal> {
    // Completa campos faltantes conversacionalmente
  }
}
```

### Estructura del Paquete

```
packages/
  iso-ai-assistant/
    ├─ src/
    │   ├─ core/
    │   │   └─ IsoAIAssistant.ts
    │   ├─ validators/
    │   │   └─ IndustrialRules.ts
    │   ├─ providers/
    │   │   ├─ OpenAIProvider.ts
    │   │   └─ LLMProvider.interface.ts
    │   ├─ types/
    │   │   └─ index.ts
    │   └─ index.ts
    ├─ tests/
    │   └─ IndustrialRules.test.ts
    ├─ package.json
    └─ tsconfig.json
```

### Providers Intercambiables

```typescript
// Permite cambiar entre OpenAI/Anthropic/etc
export interface LLMProvider {
  complete(prompt: string): Promise<string>
}

export class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string) {}
  
  async complete(prompt: string): Promise<string> {
    // Implementación OpenAI
  }
}
```

---

## ⚛️ Layer 3: Web Integration (Next.js)

### Responsabilidades

- UI/UX del Canvas
- Persistencia en Supabase
- Preview 3D con Three.js
- Export PDF
- Compartición

### Estructura

```
src/
  modules/
    canvas-isometrico/
      ├─ components/
      │   ├─ CanvasUI/
      │   │   ├─ IsometricCanvas.tsx
      │   │   ├─ Toolbar.tsx
      │   │   └─ FittingPalette.tsx
      │   ├─ ChatUI/
      │   │   ├─ AIAssistantPanel.tsx
      │   │   └─ MessageBubble.tsx
      │   ├─ Preview3D/
      │   │   └─ ThreeJSPreview.tsx
      │   └─ ShareModal/
      │       └─ ShareLinks.tsx
      ├─ hooks/
      │   ├─ useCanvasEngine.ts
      │   ├─ useAIAssistant.ts
      │   └─ useProposalPersistence.ts
      ├─ services/
      │   ├─ supabase.ts
      │   └─ pdf-generator.ts
      └─ types/
          └─ index.ts
```

### Hooks de Integración

```typescript
// hooks/useCanvasEngine.ts
import { IsoCanvasEngine } from '@lukeapp/iso-canvas-engine'

export function useCanvasEngine(config: CanvasConfig) {
  const engineRef = useRef<IsoCanvasEngine>()
  
  useEffect(() => {
    engineRef.current = new IsoCanvasEngine(config)
  }, [config])
  
  const addNode = useCallback((pos: Vector3) => {
    return engineRef.current?.addNode(pos)
  }, [])
  
  return {
    engine: engineRef.current,
    addNode,
    exportJSON: () => engineRef.current?.exportJSON()
  }
}
```

```typescript
// hooks/useAIAssistant.ts
import { IsoAIAssistant } from '@lukeapp/iso-ai-assistant'

export function useAIAssistant(projectId: string) {
  const [assistant, setAssistant] = useState<IsoAIAssistant>()
  
  useEffect(() => {
    // Fetch project config from Supabase
    const config = await getProjectConfig(projectId)
    const llm = new OpenAIProvider(process.env.OPENAI_KEY)
    setAssistant(new IsoAIAssistant(llm, config))
  }, [projectId])
  
  return assistant
}
```

---

## 🔧 Configuración del Monorepo

### Opción A: Turborepo (Recomendado)

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

```
repo/
  ├─ apps/
  │   └─ web/ (Next.js)
  ├─ packages/
  │   ├─ iso-canvas-engine/
  │   └─ iso-ai-assistant/
  ├─ turbo.json
  └─ package.json
```

### Opción B: Nx

Similar a Turborepo, pero con más features.

---

## 🧪 Testing por Capa

### Layer 1 (Engine)
```typescript
// Solo lógica pura
describe('IsoCanvasEngine', () => {
  it('should add node at snapped position', () => {
    const engine = new IsoCanvasEngine({ gridSize: 100 })
    const nodeId = engine.addNode({ x: 45, y: 67, z: 0 })
    const node = engine.getNode(nodeId)
    
    expect(node.position).toEqual({ x: 0, y: 100, z: 0 }) // Snapped
  })
})
```

### Layer 2 (AI)
```typescript
// Mock del LLM
describe('IsoAIAssistant', () => {
  it('should detect missing DN', async () => {
    const mockLLM = new MockLLMProvider()
    const assistant = new IsoAIAssistant(mockLLM, config)
    
    const response = await assistant.interpretIntent(
      "Quiero modificar el spool",
      emptyGraph
    )
    
    expect(response.missingFields).toContain('dn')
  })
})
```

### Layer 3 (UI)
```typescript
// Testing Library
describe('IsometricCanvas', () => {
  it('should render canvas element', () => {
    render(<IsometricCanvas config={config} />)
    expect(screen.getByRole('canvas')).toBeInTheDocument()
  })
})
```

---

## 📚 Publicación de Paquetes

### Privado (Dentro de la org)

```bash
# GitHub Packages
npm login --registry=https://npm.pkg.github.com
npm publish --registry=https://npm.pkg.github.com
```

### Público (npm)

```bash
npm publish --access public
```

---

## 🔄 Versionado Semántico

```
@lukeapp/iso-canvas-engine@0.1.0
                          ^ ^ ^
                          | | |
                   Major--+ | |
                   Minor----+ |
                   Patch------+
```

- `0.x.y` = Pre-release (breaking changes permitidos)
- `1.0.0` = Primera versión estable
- Cambios breaking → Major
- Features nuevas → Minor
- Bugfixes → Patch

---

## 🎯 Beneficios de Esta Arquitectura

1. **Testabilidad**: Cada capa se testea en aislamiento
2. **Reusabilidad**: El engine puede usarse fuera de Next.js
3. **Mantenibilidad**: Cambios UI no afectan lógica core
4. **Escalabilidad**: Fácil añadir nuevos providers (LLM, storage)
5. **Onboarding**: Nuevos devs entienden límites claros

---

## 🚀 Cómo Arrancar

1. **Setup Monorepo**:
   ```bash
   npx create-turbo@latest
   ```

2. **Crear Layer 1**:
   ```bash
   mkdir packages/iso-canvas-engine
   npm init -y
   ```

3. **Desarrollar Engine en aislamiento** (sin UI)

4. **Testear exhaustivamente**

5. **Luego integrar a Next.js**

---

¡Éxito! 🎉
