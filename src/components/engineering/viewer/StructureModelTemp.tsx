import React from 'react';
import { useGLTF, Center } from '@react-three/drei';

function StructureModel({ url, spatialData }: { url: string, spatialData?: any }) {
    const { scene } = useGLTF(url)
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone()

        // Apply coordinate system conversion: Navisworks (Z-up) → Three.js (Y-up)


        return clone
    }, [scene])

    // Wrap in Center like the isometric model - ignore absolute coords for now
    return (
        <Center>
            <primitive object={clonedScene} />
        </Center>
    )
}
