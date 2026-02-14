'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Stage } from '@react-three/drei'
import { X, Loader2 } from 'lucide-react'
import { Heading } from '@/components/ui/Typography'

function PreviewModel({ url }: { url: string }) {
    const { scene } = useGLTF(url)

    // Apply coordinate system conversion: Navisworks (Z-up) → Three.js (Y-up)
    // Rotate -90° around X axis
    React.useEffect(() => {

    }, [scene])

    return (
        <Center>
            <primitive object={scene} />
        </Center>
    )
}

export default function StructurePreviewModal({
    url,
    name,
    onClose
}: {
    url: string
    name: string
    onClose: () => void
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[1000px] h-[80vh] bg-slate-900 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
                    <Heading level={3} className="m-0 text-lg font-medium text-slate-100">
                        Vista Previa: {name}
                    </Heading>
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-slate-950">
                    <React.Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>Cargando modelo...</span>
                        </div>
                    }>
                        <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }}>
                            <color attach="background" args={['#020617']} />
                            <Stage environment="city" intensity={0.6}>
                                <PreviewModel url={url} />
                            </Stage>
                            <OrbitControls makeDefault />
                        </Canvas>
                    </React.Suspense>

                    {/* Instructions Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 px-4 py-2 rounded-full text-xs text-slate-400 pointer-events-none border border-white/10 backdrop-blur-md">
                        Click izquierdo: Rotar • Click derecho: Mover • Rueda: Zoom
                    </div>
                </div>
            </div>
        </div>
    )
}
