# ⚡ Prototipo de Validación - 2 Días

> **Objetivo**: Validar que el Canvas Isométrico es viable antes de invertir semanas.

---

## 🎯 Meta

Crear un **canvas mínimo funcional** que demuestre:
1. Snap a grilla isométrica
2. Dibujar 3 líneas conectadas
3. Exportar coordenadas a JSON

**Si logras esto en 2 días, Hito 1 es viable.**

---

## 🛠️ Stack Mínimo

```bash
npm create vite@latest canvas-proto -- --template react-ts
cd canvas-proto
npm install fabric
npm install
npm run dev
```

---

## 📝 Código del Prototipo

### `src/App.tsx`

```tsx
import { useEffect, useRef } from 'react'
import { Canvas, Line } from 'fabric'

interface Point {
  x: number
  y: number
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<Canvas>()
  const points = useRef<Point[]>([])
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#1a1a2e'
    })
    
    fabricCanvas.current = canvas
    
    // Dibujar grilla isométrica
    drawIsometricGrid(canvas)
    
    // Click para añadir puntos
    canvas.on('mouse:down', (e) => {
      const pointer = canvas.getPointer(e.e)
      const snapped = snapToGrid(pointer.x, pointer.y)
      
      points.current.push(snapped)
      
      // Dibujar punto
      const circle = new fabric.Circle({
        left: snapped.x,
        top: snapped.y,
        radius: 5,
        fill: '#00ff00',
        selectable: false
      })
      canvas.add(circle)
      
      // Si hay 2+ puntos, dibujar línea
      if (points.current.length >= 2) {
        const prev = points.current[points.current.length - 2]
        const line = new Line([prev.x, prev.y, snapped.x, snapped.y], {
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false
        })
        canvas.add(line)
      }
      
      console.log('Puntos:', points.current)
    })
    
    return () => canvas.dispose()
  }, [])
  
  function exportJSON() {
    console.log('Export:', JSON.stringify(points.current, null, 2))
    alert('Ver consola para JSON')
  }
  
  return (
    <div style={{ padding: 20 }}>
      <h1>Prototipo Canvas Isométrico</h1>
      <div style={{ marginBottom: 10 }}>
        <button onClick={exportJSON}>Exportar JSON</button>
        <button onClick={() => { points.current = []; fabricCanvas.current?.clear(); drawIsometricGrid(fabricCanvas.current!) }}>
          Reset
        </button>
      </div>
      <canvas ref={canvasRef} style={{ border: '1px solid #333' }} />
      <p style={{ marginTop: 10, color: '#aaa' }}>
        Click para dibujar puntos. Se conectan automáticamente.
      </p>
    </div>
  )
}

// Grilla isométrica (30°/30°)
function drawIsometricGrid(canvas: Canvas) {
  const GRID_SIZE = 50
  const width = canvas.getWidth()
  const height = canvas.getHeight()
  
  // Líneas horizontales
  for (let y = 0; y < height; y += GRID_SIZE) {
    const line = new Line([0, y, width, y], {
      stroke: '#333',
      strokeWidth: 0.5,
      selectable: false,
      evented: false
    })
    canvas.add(line)
  }
  
  // Líneas 30° izquierda
  const angleRad = (30 * Math.PI) / 180
  for (let x = -height; x < width; x += GRID_SIZE) {
    const line = new Line(
      [x, 0, x + height * Math.tan(angleRad), height],
      {
        stroke: '#333',
        strokeWidth: 0.5,
        selectable: false,
        evented: false
      }
    )
    canvas.add(line)
  }
  
  // Líneas 30° derecha
  for (let x = 0; x < width + height; x += GRID_SIZE) {
    const line = new Line(
      [x, 0, x - height * Math.tan(angleRad), height],
      {
        stroke: '#333',
        strokeWidth: 0.5,
        selectable: false,
        evented: false
      }
    )
    canvas.add(line)
  }
}

// Snap a la grilla más cercana
function snapToGrid(x: number, y: number): Point {
  const GRID_SIZE = 50
  
  // Simplificado: snap a múltiplos de GRID_SIZE
  // Para isométrico real, usar transformación matricial
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  }
}
```

---

## ✅ Criterios de Éxito

Después de 2 días:

- [ ] La grilla isométrica se ve correcta (líneas 30°/30°)
- [ ] Los puntos se "pegan" (snap) a la grilla
- [ ] Puedes dibujar 3 líneas conectadas formando una "L"
- [ ] Al hacer click en "Exportar", ves JSON con coordenadas
- [ ] El código es **comprensible** (no te sientes perdido)

**Si 4/5 son ✅, continúa al Hito 1 completo.**

---

## 🚨 Red Flags

Detente si:
- ❌ El snap no funciona después de 4 horas
- ❌ Fabric.js se siente demasiado complejo
- ❌ No entiendes cómo funciona la grilla después de 1 día

Considera alternativas:
- **Paper.js** (más amigable para vectores)
- **Three.js en ortográfica** (más directo para 3D luego)
- **Canvas API nativo** (más control, más trabajo)

---

## 📚 Recursos Rápidos

### Fabric.js
- [Docs](http://fabricjs.com/docs/)
- [Tutorial Canvas](http://fabricjs.com/fabric-intro-part-1)

### Grilla Isométrica
- [Guía visual](https://www.redblobgames.com/grids/hexagons/)
- [Matemáticas isométricas](https://stackoverflow.com/questions/892811/drawing-isometric-game-worlds)

### Snap a Grilla
```typescript
// Fórmula universal
function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}
```

---

## 🎯 Siguiente Paso

Si el prototipo funciona:

1. **Estudia el código** (entiende cada línea)
2. **Mejora el snap** (que sea más preciso en isométrico)
3. **Refactoriza** a componentes separados
4. **Añade tipos TypeScript estrictos**
5. **Arranca Hito 1 formal**

---

## 💡 Tip Final

**No busques perfección en 2 días.**

El prototipo solo debe demostrar que:
- No es imposible
- Fabric.js sirve
- Entiendes la lógica

El resto lo refinas en Hito 1.

¡Mucha suerte! 🚀
