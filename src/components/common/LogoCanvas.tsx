import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'

interface LogoCanvasProps {
    primaryLogoUrl?: string | null
    secondaryLogoUrl?: string | null
    width?: number
    height?: number
}

export default function LogoCanvas({
    primaryLogoUrl,
    secondaryLogoUrl,
    width = 200,
    height = 120,
}: LogoCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        drawCanvas()
    }, [primaryLogoUrl, secondaryLogoUrl])

    async function drawCanvas() {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, width, height)

        // Draw border
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, width, height)

        const hasBothLogos = primaryLogoUrl && secondaryLogoUrl

        if (hasBothLogos) {
            // Dual logos: split vertically (55px each)
            const logoWidth = 200
            const logoHeight = 55
            const gap = 10

            // Draw primary logo (top)
            try {
                const img = await loadImage(primaryLogoUrl)
                const scale = Math.min(logoWidth / img.width, logoHeight / img.height)
                const w = img.width * scale
                const h = img.height * scale
                const x = (logoWidth - w) / 2
                const y = (logoHeight - h) / 2
                ctx.drawImage(img, x, y, w, h)
            } catch (error) {
                drawPlaceholder(ctx, 0, 0, logoWidth, logoHeight, 'Logo Principal')
            }

            // Draw secondary logo (bottom)
            try {
                const img = await loadImage(secondaryLogoUrl!)
                const scale = Math.min(logoWidth / img.width, logoHeight / img.height)
                const w = img.width * scale
                const h = img.height * scale
                const x = (logoWidth - w) / 2
                const y = logoHeight + gap + (logoHeight - h) / 2
                ctx.drawImage(img, x, y, w, h)
            } catch (error) {
                drawPlaceholder(ctx, 0, logoHeight + gap, logoWidth, logoHeight, 'Logo Secundario')
            }
        } else if (primaryLogoUrl) {
            // Single logo: use full canvas (120px height)
            const logoWidth = 200
            const logoHeight = 120

            try {
                const img = await loadImage(primaryLogoUrl)
                const scale = Math.min(logoWidth / img.width, logoHeight / img.height)
                const w = img.width * scale
                const h = img.height * scale
                const x = (logoWidth - w) / 2
                const y = (logoHeight - h) / 2
                ctx.drawImage(img, x, y, w, h)
            } catch (error) {
                drawPlaceholder(ctx, 0, 0, logoWidth, logoHeight, 'Logo Principal')
            }
        } else {
            // No logos: show placeholder
            drawPlaceholder(ctx, 0, 0, 200, 120, 'Logo Principal')
        }
    }

    function drawPlaceholder(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        text: string
    ) {
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const lines = text.split('\n')
        lines.forEach((line, i) => {
            ctx.fillText(line, x + w / 2, y + h / 2 + (i - lines.length / 2 + 0.5) * 16)
        })
    }

    async function handleDownload() {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.toBlob((blob) => {
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'logo-preview.png'
            a.click()
            URL.revokeObjectURL(url)
        })
    }

    return (
        <div className="logo-canvas-container">
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="preview-canvas"
                />
            </div>

            {(primaryLogoUrl || secondaryLogoUrl) && (
                <button onClick={handleDownload} className="download-btn">
                    <Download size={16} />
                    <span>Descargar Preview</span>
                </button>
            )}

            <style jsx>{`
        .logo-canvas-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .canvas-wrapper {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .preview-canvas {
          display: block;
          border-radius: 4px;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #cbd5e1;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .download-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
      `}</style>
        </div>
    )
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}
