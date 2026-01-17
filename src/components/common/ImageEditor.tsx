import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import { X, RotateCcw, RotateCw, RefreshCw } from 'lucide-react'
import type { Area } from 'react-easy-crop'

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
    <div className="editor-overlay">
      <div className="editor-modal">
        {/* Header */}
        <div className="editor-header">
          <h2>{title}</h2>
          <button onClick={onCancel} className="close-btn" disabled={isSaving}>
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="cropper-container">
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
        <div className="editor-controls">
          {/* Zoom Slider */}
          <div className="control-group">
            <label>Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="zoom-slider"
            />
          </div>

          {/* Rotation Buttons */}
          <div className="control-group">
            <label>Rotación</label>
            <div className="rotation-buttons">
              <button onClick={handleRotateLeft} className="rotate-btn" disabled={isSaving}>
                <RotateCcw size={18} />
                <span>-90°</span>
              </button>
              <button onClick={handleRotateRight} className="rotate-btn" disabled={isSaving}>
                <RotateCw size={18} />
                <span>+90°</span>
              </button>
              <button onClick={handleReset} className="rotate-btn" disabled={isSaving}>
                <RefreshCw size={18} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="editor-actions">
          <button onClick={onCancel} className="btn-secondary" disabled={isSaving}>
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .editor-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s;
        }

        .editor-modal {
          background: #1e293b;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .editor-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .editor-header h2 {
          margin: 0;
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .close-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .cropper-container {
          position: relative;
          width: 100%;
          height: 400px;
          background: #0f172a;
        }

        .editor-controls {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .control-group label {
          color: #cbd5e1;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .zoom-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
        }

        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .zoom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }

        .rotation-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .rotate-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #cbd5e1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .rotate-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .rotate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .editor-actions {
          padding: 1.5rem 2rem;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-secondary, .btn-primary {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.9rem;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
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
