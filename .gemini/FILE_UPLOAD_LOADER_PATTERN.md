# Patrón de Loader para Carga de Archivos

Este documento define el patrón estándar para implementar indicadores de carga (loaders) en operaciones de carga de archivos.

## Componentes del Patrón

### 1. Estado de Carga
```typescript
// Usar un estado que identifique QUÉ elemento está cargando
const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
```

### 2. Estilos del Botón Durante Carga

```typescript
style={{
    cursor: uploadingItemId === itemId ? 'wait' : 'pointer',
    color: uploadingItemId === itemId ? '#fbbf24' : normalColor,
    backgroundColor: uploadingItemId === itemId ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
    opacity: uploadingItemId === itemId ? 0.7 : 1,
    transition: 'all 0.2s ease'
}}
```

**Colores:**
- **Cargando**: `#fbbf24` (Amarillo) con fondo `rgba(251, 191, 36, 0.1)`
- **Cursor**: `wait` durante carga
- **Opacidad**: `0.7` durante carga

### 3. Icono de Carga

```tsx
{uploadingItemId === itemId ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
            animation: 'spin 1s linear infinite', 
            display: 'inline-block' 
        }}>⏳</span>
    </span>
) : (
    <NormalIcon />
)}
```

**Icono**: ⏳ (Reloj de arena)

### 4. Tooltip Dinámico

```typescript
title={uploadingItemId === itemId ? 'Cargando archivo...' : normalTitle}
```

### 5. Deshabilitación del Botón

```typescript
onClick={(e) => {
    e.stopPropagation()
    if (uploadingItemId === itemId) return // Prevenir clicks múltiples
    // ... lógica normal
}}
disabled={uploadingItemId === itemId}
```

### 6. Mensaje de Éxito

```typescript
// Después de carga exitosa
alert('✅ Archivo cargado exitosamente')
```

### 7. Limpieza del Estado

```typescript
try {
    // ... upload logic
    alert('✅ Archivo cargado exitosamente')
    if (onRefresh) onRefresh()
} catch (error) {
    console.error('Error:', error)
    alert('Error al subir archivo: ' + error.message)
} finally {
    setUploadingItemId(null) // Siempre limpiar el estado
    if (fileInputRef.current) fileInputRef.current.value = ''
}
```

## Ejemplo Completo: Botón de Carga de PDF

```tsx
<button
    onClick={(e) => {
        e.stopPropagation()
        if (uploadingPdfRevId === rev.id) return
        if (rev.pdf_url) {
            window.open(rev.pdf_url, '_blank')
        } else {
            handlePdfUploadClick(rev.id)
        }
    }}
    style={{
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '4px',
        border: 'none',
        cursor: uploadingPdfRevId === rev.id ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        color: uploadingPdfRevId === rev.id ? '#fbbf24' : (rev.pdf_url ? '#ef4444' : '#94a3b8'),
        backgroundColor: uploadingPdfRevId === rev.id ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        opacity: uploadingPdfRevId === rev.id ? 0.7 : 1
    }}
    title={uploadingPdfRevId === rev.id ? 'Cargando PDF...' : (rev.pdf_url ? 'Ver PDF' : 'Cargar PDF')}
    disabled={uploadingPdfRevId === rev.id}
>
    {uploadingPdfRevId === rev.id ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
        </span>
    ) : (
        <FileText size={14} />
    )}
</button>
```

## Estados del Botón

### Estado 1: Sin Archivo (Idle)
- Color: Gris (`#94a3b8`)
- Icono: Normal (ej: FileText)
- Tooltip: "Cargar [tipo de archivo]"
- Cursor: `pointer`

### Estado 2: Cargando
- Color: Amarillo (`#fbbf24`)
- Fondo: Amarillo translúcido (`rgba(251, 191, 36, 0.1)`)
- Icono: ⏳ (animado)
- Tooltip: "Cargando [tipo de archivo]..."
- Cursor: `wait`
- Opacidad: `0.7`
- Deshabilitado: `true`

### Estado 3: Archivo Cargado
- Color: Rojo (`#ef4444`) o color específico del tipo
- Icono: Normal
- Tooltip: "Ver [tipo de archivo]"
- Cursor: `pointer`
- Acción al click: Abrir archivo

### Estado 4: Opción de Eliminar
Si el archivo ya está cargado, mostrar botón secundario de eliminación:

```tsx
{rev.pdf_url && (
    <button
        onClick={(e) => {
            e.stopPropagation()
            handleDeletePdf(rev.id, rev.pdf_url!)
        }}
        title="Eliminar PDF"
        style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#1e293b',
            border: '1px solid #ef4444',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: '10px'
        }}
    >
        ✕
    </button>
)}
```

## Reglas de Negocio

1. **Un archivo por registro**: Solo se permite cargar 1 archivo por entidad/revisión
2. **Reemplazo**: Para reemplazar un archivo, primero se debe eliminar el existente
3. **Feedback obligatorio**: Siempre mostrar mensaje de éxito/error
4. **Prevención de duplicados**: Deshabilitar botón durante la carga
5. **Limpieza de input**: Limpiar el valor del input después de cada operación

## Implementación de Handler

```typescript
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingItemId) return

    const item = items.find(i => i.id === uploadingItemId)
    if (!item) return

    try {
        const supabase = createClient()
        const fileName = `file-${uploadingItemId}-${Date.now()}.ext`
        const filePath = `${item.company_id}/${item.project_id}/folder/${fileName}`

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(filePath)

        // 3. Update Database
        const res = await updateFileUrlAction(uploadingItemId, publicUrl)
        if (!res.success) throw new Error(res.message)

        // 4. Success Feedback
        alert('✅ Archivo cargado exitosamente')
        router.refresh() // Force server data refresh
        if (onRefresh) onRefresh()
    } catch (error: any) {
        console.error('Error uploading file:', error)
        alert('Error al subir archivo: ' + (error.message || 'Error desconocido'))
    } finally {
        setUploadingItemId(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }
}
```

## Manejo de Selector de Archivos

**Enfoque Correcto**: No activar el estado de carga HASTA que el archivo sea seleccionado.

### Problema Anterior
Activar el estado de carga al hacer click en el botón causaba que la animación comenzara de inmediato, incluso si el usuario cancelaba el selector de archivos.

### Solución Actual
Usar data attributes en el input para almacenar el ID del objetivo, y solo activar el estado cuando `onChange` se dispara con un archivo válido.

```typescript
// Handler del botón - NO activa estado de carga
const handleUploadClick = (itemId: string) => {
    // Almacenar el ID del objetivo en el input
    fileInputRef.current?.setAttribute('data-target-item-id', itemId)
    fileInputRef.current?.click()
}

// Handler del onChange - AQUÍ se activa el estado
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetItemId = e.target.getAttribute('data-target-item-id')
    
    if (!file || !targetItemId) {
        // Usuario canceló o no hay objetivo
        return
    }

    // AHORA activar estado de carga (archivo fue seleccionado)
    setUploadingItemId(targetItemId)

    try {
        // ... lógica de upload
    } catch (error) {
        // ... manejo de errores
    } finally {
        setUploadingItemId(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }
}

## Uso en Otros Componentes

Este patrón debe aplicarse en:
- ✅ Carga de PDFs de isométricos
- ✅ Carga de modelos 3D (GLB)
- Carga de imágenes de logos de proyectos
- Carga de archivos adjuntos en MIRs
- Carga de evidencias fotográficas
- Cualquier otra operación de carga de archivos

## Notas de Implementación

- **No usar múltiples estados**: Un solo estado `uploadingItemId` es suficiente
- **Accesibilidad**: Usar `disabled` y `aria-busy` cuando corresponda
- **Consistencia**: Mantener los mismos colores y comportamientos en todo el sistema
- **Performance**: El indicador debe ser ligero (solo CSS + emoji, sin librerías)
