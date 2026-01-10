import { SpatialTransform, StructureModel } from '@/types'

/**
 * Converts a model's spatial metadata to Three.js-compatible transform format
 * 
 * @param model - Model with spatial metadata fields
 * @returns SpatialTransform object ready for Three.js
 */
export function getSpatialTransform(
    model: StructureModel | any
): SpatialTransform {
    return {
        position: {
            x: model.position_x ?? 0,
            y: model.position_y ?? 0,
            z: model.position_z ?? 0
        },
        rotation: {
            x: model.rotation_x ?? 0,
            y: model.rotation_y ?? 0,
            z: model.rotation_z ?? 0
        },
        scale: {
            x: model.scale_x ?? 1,
            y: model.scale_y ?? 1,
            z: model.scale_z ?? 1
        }
    }
}

/**
 * Checks if a model has spatial metadata
 * 
 * @param model - Model to check
 * @returns true if model has any spatial metadata
 */
export function hasSpatialMetadata(model: StructureModel | any): boolean {
    return (
        model.position_x !== null && model.position_x !== undefined ||
        model.position_y !== null && model.position_y !== undefined ||
        model.position_z !== null && model.position_z !== undefined
    )
}

/**
 * Formats spatial coordinates for display
 * 
 * @param model - Model with spatial metadata
 * @returns Formatted string like "X: 123.45, Y: 67.89, Z: 10.11"
 */
export function formatSpatialPosition(model: StructureModel | any): string {
    const { position } = getSpatialTransform(model)
    return `X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}`
}
