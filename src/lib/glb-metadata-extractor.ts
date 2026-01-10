/**
 * GLB Metadata Extractor
 * 
 * Extracts spatial metadata (position, rotation, scale) from GLB files
 * exported from Navisworks. These files contain embedded world coordinates.
 * 
 * @module glb-metadata-extractor
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface SpatialMetadata {
    position: {
        x: number
        y: number
        z: number
    }
    rotation: {
        x: number
        y: number
        z: number
    }
    scale: {
        x: number
        y: number
        z: number
    }
    boundingBox: {
        min: { x: number; y: number; z: number }
        max: { x: number; y: number; z: number }
        center: { x: number; y: number; z: number }
        size: { x: number; y: number; z: number }
    }
}

/**
 * Extracts spatial metadata from a GLB file
 * 
 * @param fileBuffer - ArrayBuffer containing the GLB file data
 * @returns Promise resolving to spatial metadata
 */
export async function extractGLBMetadata(
    fileBuffer: ArrayBuffer
): Promise<SpatialMetadata> {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()

        // Convert ArrayBuffer to data URL
        const blob = new Blob([fileBuffer], { type: 'model/gltf-binary' })
        const url = URL.createObjectURL(blob)

        loader.load(
            url,
            (gltf) => {
                // Clean up object URL
                URL.revokeObjectURL(url)

                // Get the root scene
                const scene = gltf.scene

                // Calculate bounding box for the entire model
                const box = new THREE.Box3().setFromObject(scene)
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())

                // Get transform from root object
                // Navisworks exports usually have the transform on the root node
                const position = scene.position.clone()
                const rotation = scene.rotation.clone()
                const scale = scene.scale.clone()

                // If root position is (0,0,0), use bounding box center
                // This handles cases where the model is centered at origin
                const finalPosition = position.length() === 0 ? center : position

                const metadata: SpatialMetadata = {
                    position: {
                        x: finalPosition.x,
                        y: finalPosition.y,
                        z: finalPosition.z
                    },
                    rotation: {
                        x: rotation.x,
                        y: rotation.y,
                        z: rotation.z
                    },
                    scale: {
                        x: scale.x,
                        y: scale.y,
                        z: scale.z
                    },
                    boundingBox: {
                        min: {
                            x: box.min.x,
                            y: box.min.y,
                            z: box.min.z
                        },
                        max: {
                            x: box.max.x,
                            y: box.max.y,
                            z: box.max.z
                        },
                        center: {
                            x: center.x,
                            y: center.y,
                            z: center.z
                        },
                        size: {
                            x: size.x,
                            y: size.y,
                            z: size.z
                        }
                    }
                }

                resolve(metadata)
            },
            undefined,
            (error: unknown) => {
                URL.revokeObjectURL(url)
                const errorMessage = error instanceof Error ? error.message : String(error)
                reject(new Error(`Failed to load GLB: ${errorMessage}`))
            }
        )
    })
}

/**
 * Extracts spatial metadata from a GLB file (browser/client-side)
 * 
 * @param file - File object from file input
 * @returns Promise resolving to spatial metadata
 */
export async function extractGLBMetadataFromFile(
    file: File
): Promise<SpatialMetadata> {
    const buffer = await file.arrayBuffer()
    return extractGLBMetadata(buffer)
}

/**
 * Extracts spatial metadata from a GLB URL
 * 
 * @param url - URL to the GLB file
 * @returns Promise resolving to spatial metadata
 */
export async function extractGLBMetadataFromURL(
    url: string
): Promise<SpatialMetadata> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch GLB from ${url}: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    return extractGLBMetadata(buffer)
}
