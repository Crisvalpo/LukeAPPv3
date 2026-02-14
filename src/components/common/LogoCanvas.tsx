import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="flex flex-col gap-4 items-center">
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="block rounded"
                />
            </div>

            {(primaryLogoUrl || secondaryLogoUrl) && (
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2 border-white/10 hover:bg-white/5 text-text-muted hover:text-white"
                >
                    <Download size={16} />
                    <span>Descargar Preview</span>
                </Button>
            )}
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
