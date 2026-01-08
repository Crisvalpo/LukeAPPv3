import React, { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei'
import * as THREE from 'three'

interface IsometricViewerProps {
    modelUrl: string
    spools?: any[]
    initialModelData?: any
    onSaveData?: (data: any) => void
}

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url)
    const { camera, controls } = useThree()

    // Auto-Fit Camera on Load
    useEffect(() => {
        if (!scene) return

        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(scene)
        const size = box.getSize(new THREE.Vector3())

        // Max Dimension for camera distance
        const maxDim = Math.max(size.x, size.y, size.z)

        // Reset camera position to a nice isometric angle based on object size
        // Distance factor: 2.5 ensures it fits well with some padding
        const distance = maxDim * 2.5

        camera.position.set(distance, distance, distance)
        camera.lookAt(0, 0, 0) // Look at world origin (since we Center component centers model there)

        if (controls) {
            // @ts-ignore
            controls.target.set(0, 0, 0)
            // @ts-ignore
            controls.update()
        }

    }, [scene, camera, controls])

    // Ensure shadows are enabled on all meshes
    useEffect(() => {
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }, [scene])

    return (
        <Center>
            <primitive object={scene} />
        </Center>
    )
}

export default function IsometricViewer({ modelUrl }: IsometricViewerProps) {
    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#1e293b', // Slate-900
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 10, 10], fov: 45 }}>
                <color attach="background" args={['#1e293b']} />

                {/* Lighting Setup for good visibility */}
                <ambientLight intensity={0.7} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <directionalLight position={[-10, -5, -5]} intensity={0.5} color="#b0c4de" />

                {/* Environment for reflections */}
                <Environment preset="city" />

                <React.Suspense fallback={null}>
                    <Model url={modelUrl} />
                </React.Suspense>

                <OrbitControls makeDefault />

                {/* Simple Helpers - Large enough to cover most models */}
                <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.5, 0]} />
            </Canvas>
        </div>
    )
}
