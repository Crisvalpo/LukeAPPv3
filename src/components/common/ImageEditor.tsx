import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import { X, RotateCcw, RotateCw, RefreshCw } from 'lucide-react'
import type { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/Typography'

interface ImageEditorProps {
  imageUrl: string
  onSave: (croppedImage: Blob, cropSettings: CropSettings) => Promise<void>
  onCancel: () => void
  title?: string
  aspect?: number
  cropShape?: 'rect' | 'round'
}

export interface CropSettings {
  x: number
  y: number
  width: number
  height: number
  zoom: number
  rotation: number
}

export default function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
  title = 'Editar Logo',
  aspect = 200 / 55,
  cropShape = 'rect'
}: ImageEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360)
  }

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) throw new Error('No crop area selected')

    const image = await createImage(imageUrl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) throw new Error('No 2d context')

    const maxSize = 2048
    const safeArea = Math.max(image.width, image.height) * 2

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width / 2,
      safeArea / 2 - image.height / 2
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height

    ctx.putImageData(
      data,
      -safeArea / 2 + image.width / 2 - croppedAreaPixels.x,
      -safeArea / 2 + image.height / 2 - croppedAreaPixels.y
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png')
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    setIsSaving(true)
    try {
      const croppedImage = await createCroppedImage()
      const cropSettings: CropSettings = {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        zoom,
        rotation,
      }
      await onSave(croppedImage, cropSettings)
    } catch (error) {
      console.error('Error saving cropped image:', error)
      alert('Error al guardar la imagen')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-bg-surface-1 rounded-xl w-[90%] max-w-[600px] max-h-[90vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <Heading level={3} className="m-0 text-lg">{title}</Heading>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="text-text-muted hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[400px] bg-slate-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />
        </div>

        {/* Controls */}
        <div className="p-6 flex flex-col gap-6 border-b border-white/10 bg-bg-surface-1">
          {/* Zoom Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-text-secondary">Zoom</label>
              <span className="text-sm font-mono text-text-muted">{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-primary"
            />
          </div>

          {/* Rotation Buttons */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-text-secondary">Rotación</label>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRotateLeft}
                disabled={isSaving}
                className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              >
                <RotateCcw size={16} />
                <span>-90°</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleRotateRight}
                disabled={isSaving}
                className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              >
                <RotateCw size={16} />
                <span>+90°</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1 gap-2 text-text-muted hover:text-white hover:bg-white/5"
              >
                <RefreshCw size={16} />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-4 justify-end bg-white/[0.02]">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-white/10 hover:bg-white/5 text-text-secondary hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white min-w-[100px]"
          >
            {isSaving ? 'Guardando...' : 'Aplicar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Helper function to create image element
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}
