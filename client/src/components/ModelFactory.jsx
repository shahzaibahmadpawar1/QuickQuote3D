import React from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';

const ModelFactory = ({ item, isSelected }) => {
    const { dimensions, category, color } = item;
    const materialColor = isSelected ? "#ff9f00" : (color || "orange"); // Highlight color

    // Normalize dimensions ensuring they exist
    const w = dimensions?.width || 1;
    const h = dimensions?.height || 1;
    const l = dimensions?.length || 1;

    // Helper for material
    const Material = () => <meshStandardMaterial color={materialColor} />;

    switch (category?.toLowerCase()) {
        case 'table':
            return (
                <group>
                    {/* Table Top */}
                    <Box args={[w, 0.1, l]} position={[0, h - 0.05, 0]} castShadow receiveShadow>
                        <Material />
                    </Box>
                    {/* Legs */}
                    <Box args={[0.1, h - 0.1, 0.1]} position={[w / 2 - 0.1, (h - 0.1) / 2, l / 2 - 0.1]} castShadow><Material /></Box>
                    <Box args={[0.1, h - 0.1, 0.1]} position={[-w / 2 + 0.1, (h - 0.1) / 2, l / 2 - 0.1]} castShadow><Material /></Box>
                    <Box args={[0.1, h - 0.1, 0.1]} position={[w / 2 - 0.1, (h - 0.1) / 2, -l / 2 + 0.1]} castShadow><Material /></Box>
                    <Box args={[0.1, h - 0.1, 0.1]} position={[-w / 2 + 0.1, (h - 0.1) / 2, -l / 2 + 0.1]} castShadow><Material /></Box>
                </group>
            );

        case 'chair':
            return (
                <group>
                    {/* Seat */}
                    <Box args={[w, 0.1, l]} position={[0, h / 2, 0]} castShadow><Material /></Box>
                    {/* Backrest */}
                    <Box args={[w, h / 2, 0.1]} position={[0, h * 0.75, -l / 2 + 0.05]} castShadow><Material /></Box>
                    {/* Legs */}
                    <Box args={[0.05, h / 2, 0.05]} position={[w / 2 - 0.05, h / 4, l / 2 - 0.05]} castShadow><Material /></Box>
                    <Box args={[0.05, h / 2, 0.05]} position={[-w / 2 + 0.05, h / 4, l / 2 - 0.05]} castShadow><Material /></Box>
                    <Box args={[0.05, h / 2, 0.05]} position={[w / 2 - 0.05, h / 4, -l / 2 + 0.05]} castShadow><Material /></Box>
                    <Box args={[0.05, h / 2, 0.05]} position={[-w / 2 + 0.05, h / 4, -l / 2 + 0.05]} castShadow><Material /></Box>
                </group>
            );

        case 'sofa':
            return (
                <group>
                    {/* Base */}
                    <Box args={[w, h / 2, l]} position={[0, h / 4, 0]} castShadow><Material /></Box>
                    {/* Back */}
                    <Box args={[w, h / 2, 0.2]} position={[0, h * 0.75, -l / 2 + 0.1]} castShadow><Material /></Box>
                    {/* Arms */}
                    <Box args={[0.2, h / 4, l]} position={[w / 2 - 0.1, h * 0.6, 0]} castShadow><Material /></Box>
                    <Box args={[0.2, h / 4, l]} position={[-w / 2 + 0.1, h * 0.6, 0]} castShadow><Material /></Box>
                </group>
            );

        case 'cabinet':
        case 'storage':
            return (
                <Box args={[w, h, l]} position={[0, h / 2, 0]} castShadow>
                    <meshStandardMaterial color={materialColor} />
                    {/* Simple door detail */}
                    <Box args={[w - 0.1, h - 0.1, 0.01]} position={[0, 0, l / 2 + 0.01]}>
                        <meshStandardMaterial color="#444" />
                    </Box>
                </Box>
            );

        default:
            // Fallback for unknown items
            return (
                <Box args={[w, h, l]} position={[0, h / 2, 0]} castShadow>
                    <meshStandardMaterial color={materialColor} />
                    {/* Wireframe effect to hint it's generic */}
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(w, h, l)]} />
                        <lineBasicMaterial color="black" />
                    </lineSegments>
                </Box>
            );
    }
};

import * as THREE from 'three';
export default ModelFactory;
