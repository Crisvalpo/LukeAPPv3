import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei'
import * as THREE from 'three'

interface IsometricViewerProps {
    modelUrl: string
    spools?: any[]
    initialModelData?: any
    onSaveData?: (data: any) => void
    // Control Props
    mode: 'ORBIT' | 'PAN'
    speed: number
    triggerFit: boolean
    onFitComplete: () => void
    // Assignment Props
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
    highlightedIds?: string[] // Ids to highlight (from card selection)
    assignments?: Record<string, string[]> // spoolId -> elementIds
    spoolColors?: Record<string, string> // spoolId -> color
    // Structure Props
    structureModels?: any[]
    showStructure?: boolean
}

function StructureModel({ url, spatialData }: { url: string, spatialData?: any }) {
    const { scene } = useGLTF(url)
    const clonedScene = React.useMemo(() => {
        // Clone scene to avoid shared state, but DO NOT modify materials
        // We want to respect the original GLB exports (transparency, colors, etc)
        const clone = scene.clone()
        return clone
    }, [scene])

    return <primitive object={clonedScene} />
}

function Model({
    url,
    onLoad,
    selectedIds = [],
    highlightedIds = [],
    onSelectionChange,
    assignments = {},
    spoolColors = {}
}: {
    url: string,
    onLoad?: (scene: THREE.Group) => void
    selectedIds?: string[]
    highlightedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
    assignments?: Record<string, string[]>
    spoolColors?: Record<string, string>
}) {
    const { scene } = useGLTF(url)
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone()



        return clone
    }, [scene])
    const [hovered, setHovered] = useState<string | null>(null)

    // Derived map for fast assignment lookup: elementId -> color
    const elementColorMap = React.useMemo(() => {
        const map: Record<string, string> = {}
        Object.entries(assignments).forEach(([spoolId, elementIds]) => {
            const color = spoolColors[spoolId] || '#94a3b8' // Default to Grey (Pending) instead of Green to avoid flash
            elementIds.forEach(id => {
                map[id] = color
            })
        })
        return map
    }, [assignments, spoolColors])

    // Effect: Apply materials based on selection and assignment
    useEffect(() => {
        if (!clonedScene) return

        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                // Ensure unique ID for selection (fallback to uuid if name not unique)
                // Using name is better for persistence if names are stable from CAD
                const id = child.userData.name || child.name || child.uuid
                // Store ID on userdata for raycasting
                child.userData.id = id

                // Clone material to avoid shared mutations
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone()
                }

                const isSelected = selectedIds.includes(id)
                const isHighlighted = highlightedIds.includes(id)
                const isHovered = hovered === id
                const assignedColor = elementColorMap[id]
                const isIsolationMode = highlightedIds.length > 0

                // Reset transparency/opacity defaults
                child.material.transparent = isIsolationMode // Enable transparency if in isolation mode
                child.material.opacity = 1

                if (isSelected) {
                    child.material = child.userData.originalMaterial.clone()
                    child.material.emissive.setHex(0xff4500) // Orange Red
                    child.material.emissiveIntensity = 0.5
                    child.material.color.setHex(0xff6347)
                    child.material.transparent = false
                    child.material.opacity = 1
                } else if (isHighlighted) {
                    // Active Spool Highlight - Purple & Opaque
                    child.material = child.userData.originalMaterial.clone()
                    child.material.color.setHex(0xd8b4fe) // Purple-300
                    child.material.emissive.setHex(0xa855f7) // Purple-500
                    child.material.emissiveIntensity = 0.8
                    child.material.transparent = false
                    child.material.opacity = 1
                } else if (isIsolationMode) {
                    // GHOSTING: Non-highlighted items in Isolation Mode
                    child.material = child.userData.originalMaterial.clone()
                    // Keep original color but fade it out significantly
                    child.material.transparent = true
                    child.material.opacity = 0.1 // Much more transparent (10%)
                    child.material.depthWrite = false // Important for transparency sorting sometimes
                    child.material.emissiveIntensity = 0
                } else if (isHovered) {
                    child.material = child.userData.originalMaterial.clone()
                    child.material.emissive.setHex(0x3b82f6) // Blue hover
                    child.material.emissiveIntensity = 0.3
                    child.material.transparent = false
                    child.material.opacity = 1
                } else if (assignedColor) {
                    child.material = child.userData.originalMaterial.clone()
                    child.material.color.set(assignedColor)
                    child.material.emissive.setHex(0x000000)
                    child.material.emissiveIntensity = 0
                    child.material.transparent = false
                    child.material.opacity = 1
                } else {
                    // Reset to Base (Unassigned) -> FORCE GREY
                    // The user complained that "Base" looks yellow (likely original material).
                    // We override this to ensure a clean Grey base state.
                    child.material = child.userData.originalMaterial.clone()
                    child.material.color.setHex(0xe2e8f0) // Slate-200 (Light neutral grey)
                    child.material.emissive.setHex(0x000000)
                    child.material.emissiveIntensity = 0
                    child.material.transparent = false
                    child.material.opacity = 1
                }

                child.material.needsUpdate = true // CRITICAL: Force update for transparency changes
            }
        })
    }, [clonedScene, selectedIds, highlightedIds, hovered, elementColorMap])

    // Auto-Fit Camera on Load
    useEffect(() => {
        if (!clonedScene) return
        if (onLoad) onLoad(clonedScene)
    }, [clonedScene, onLoad])

    // Ensure shadows are enabled on all meshes
    useEffect(() => {
        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }, [clonedScene])

    // Custom click handling refs
    const clickStartRef = useRef<{ x: number, y: number, time: number } | null>(null)

    const handlePointerDown = (e: any) => {
        e.stopPropagation()
        clickStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            time: Date.now()
        }
    }

    const handlePointerUp = (e: any) => {
        e.stopPropagation()
        if (!clickStartRef.current) return

        const { x, y, time } = clickStartRef.current
        const deltaX = Math.abs(e.clientX - x)
        const deltaY = Math.abs(e.clientY - y)
        const duration = Date.now() - time

        // Relaxed threshold for "Click": 10px movement, 500ms duration
        // This ensures minor shakes while holding Ctrl don't cancel the click
        if (deltaX < 10 && deltaY < 10 && duration < 500) {
            handleSelection(e)
        }

        clickStartRef.current = null
    }

    const handleSelection = (e: any) => {
        // e.stopPropagation() // Already handled in Up/Down
        if (!onSelectionChange) return

        // Get the mesh that was clicked
        const mesh = e.object
        const id = mesh.userData.id

        // Multi-select logic (CMD/CTRL or SHIFT key)
        const isMulti = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey || e.nativeEvent.shiftKey

        // Check if this element belongs to an existing spool (Group Selection Logic)
        let groupIds: string[] | null = null
        if (!isMulti) { // Only apply smart grouping on single click to avoid fighting with multi-select flexibility
            Object.entries(assignments).forEach(([spoolId, elementIds]) => {
                if (elementIds.includes(id)) {
                    groupIds = elementIds
                }
            })
        }

        let newSelection = [...selectedIds]

        if (groupIds) {
            // Smart Group Selection: Select the whole spool
            newSelection = groupIds
        } else {
            // Standard Single/Multi Selection Logic
            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(item => item !== id)
            } else {
                if (isMulti) {
                    newSelection.push(id)
                } else {
                    newSelection = [id]
                }
            }
        }

        onSelectionChange(newSelection)
    }

    const handlePointerOver = (e: any) => {
        e.stopPropagation()
        setHovered(e.object.userData.id)
    }

    const handlePointerOut = (e: any) => {
        e.stopPropagation()
        setHovered(null)
    }

    return (
        <primitive
            object={clonedScene}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMissed={(e: any) => {
                // Only clear if not clicking UI (handled by stopPropagation usually)
                // But in canvas, missed means background
                if (onSelectionChange && !e.shiftKey && !e.ctrlKey) {
                    onSelectionChange([])
                }
            }}
        />
    )
}

// Controller component to handle external tool actions
function ViewerController({
    mode,
    speed,
    triggerFit,
    onFitComplete,
    targetObject
}: {
    mode: 'ORBIT' | 'PAN'
    speed: number
    triggerFit: boolean
    onFitComplete: () => void
    targetObject: THREE.Object3D | null
}) {
    const { camera, controls, scene } = useThree()
    const controlsRef = useRef<any>(null)
    const [initialFitDone, setInitialFitDone] = useState(false)

    // Function to perform global fit
    const performFit = () => {
        // Calculate bounding box for ENTIRE scene (isometric + structures)
        // But exclude Helpers and Lights to focus on Models only
        const box = new THREE.Box3()
        let hasMeshes = false

        scene.traverse((obj) => {
            if (obj.type === 'Mesh') {
                box.expandByObject(obj)
                hasMeshes = true
            }
        })

        if (!hasMeshes) return

        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)

        if (maxDim === 0) return

        const distance = maxDim * 2.5

        // Isometric view from center
        const direction = new THREE.Vector3(1, 1, 1).normalize()
        const position = center.clone().add(direction.multiplyScalar(distance))

        camera.position.copy(position)
        camera.lookAt(center)

        if (controlsRef.current) {
            controlsRef.current.target.copy(center)
            controlsRef.current.update()
        }
    }

    // Handle Manual Fit Trigger
    useEffect(() => {
        if (triggerFit) {
            performFit()
            onFitComplete()
        }
    }, [triggerFit, scene, camera, onFitComplete])

    // Auto-Fit on Initial Load
    useEffect(() => {
        if (scene.userData.initialFitDone) return

        // Check if scene has meshes repeatedly until loaded
        const checkModels = setInterval(() => {
            let meshCount = 0
            scene.traverse((obj) => {
                if (obj.type === 'Mesh') meshCount++
            })

            if (meshCount > 0) {
                // Models are loaded, fit view
                performFit()
                scene.userData.initialFitDone = true // Persist fit state on the scene object
                setInitialFitDone(true) // Keep local state update to force re-render if needed
                clearInterval(checkModels)
            }
        }, 200) // Check every 200ms

        // Safety timeout to stop checking
        const timeout = setTimeout(() => {
            clearInterval(checkModels)
        }, 5000)

        return () => {
            clearInterval(checkModels)
            clearTimeout(timeout)
        }
    }, [scene])

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping={true}
            dampingFactor={0.1}
            rotateSpeed={speed}
            zoomSpeed={speed}
            panSpeed={speed}
            mouseButtons={{
                LEFT: mode === 'PAN' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: mode === 'PAN' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
            }}
        />
    )
}

export default function IsometricViewer({
    modelUrl,
    mode,
    speed,
    triggerFit,
    onFitComplete,
    selectedIds,
    highlightedIds,
    onSelectionChange,
    assignments,
    spoolColors,
    structureModels = [],
    showStructure = true
}: IsometricViewerProps) {
    const [modelScene, setModelScene] = useState<THREE.Object3D | null>(null)

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 10, 10], fov: 45 }}>
                <color attach="background" args={['#1e293b']} />

                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                <directionalLight position={[-10, -5, -5]} intensity={0.5} color="#b0c4de" />
                <Environment preset="city" />

                <React.Suspense fallback={null}>
                    <Model
                        url={modelUrl}
                        onLoad={(scene) => setModelScene(scene)}
                        selectedIds={selectedIds}
                        highlightedIds={highlightedIds}
                        onSelectionChange={onSelectionChange}
                        assignments={assignments}
                        spoolColors={spoolColors}
                    />
                    {showStructure && structureModels.map((model, idx) => (
                        <StructureModel
                            key={model.id || idx}
                            url={model.model_url}
                            spatialData={model}
                        />
                    ))}
                </React.Suspense>

                <ViewerController
                    mode={mode}
                    speed={speed}
                    triggerFit={triggerFit}
                    onFitComplete={onFitComplete}
                    targetObject={modelScene}
                />

                <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.5, 0]} />
            </Canvas>
        </div>
    )
}
