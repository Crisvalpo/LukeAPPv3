'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Stage } from '@react-three/drei'
import { X, Loader2 } from 'lucide-react'

function PreviewModel({ url }: { url: string }) {
    const { scene } = useGLTF(url)
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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }} onClick={onClose}>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1000px',
                height: '80vh',
                backgroundColor: '#1e293b',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#0f172a'
                }}>
                    <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>
                        Vista Previa: {name}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.2s, background-color 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#f1f5f9'
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = '#94a3b8'
                            e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Canvas Area */}
                <div style={{ flex: 1, position: 'relative', backgroundColor: '#0f172a' }}>
                    <React.Suspense fallback={
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            gap: '0.5rem'
                        }}>
                            <Loader2 className="animate-spin" size={24} />
                            <span>Cargando modelo...</span>
                        </div>
                    }>
                        <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }}>
                            <color attach="background" args={['#0f172a']} />
                            <Stage environment="city" intensity={0.6}>
                                <PreviewModel url={url} />
                            </Stage>
                            <OrbitControls makeDefault />
                        </Canvas>
                    </React.Suspense>

                    {/* Instructions Overlay */}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                        border: '1px solid #334155'
                    }}>
                        Click izquierdo: Rotar • Click derecho: Mover • Rueda: Zoom
                    </div>
                </div>
            </div>
        </div>
    )
}
