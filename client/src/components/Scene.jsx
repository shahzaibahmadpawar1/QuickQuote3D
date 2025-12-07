import React, { useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Stage } from '@react-three/drei';
import * as THREE from 'three';

const RoomMesh = ({ width, length, height }) => {
    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>
            {/* Grid Helper on Floor */}
            <Grid args={[width, length]} position={[0, 0.01, 0]} cellColor="white" sectionColor="black" infiniteGrid />

            {/* Walls (Simple visualization) */}
            {/* Back Wall */}
            <mesh position={[0, height / 2, -length / 2]} receiveShadow>
                <boxGeometry args={[width, height, 0.1]} />
                <meshStandardMaterial color="#e0e0e0" />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[length, height, 0.1]} />
                <meshStandardMaterial color="#e0e0e0" />
            </mesh>
        </group>
    );
};

const DraggableItem = ({ item, onTransform, selected, onSelect }) => {
    // Create a simple box geometry based on dimensions if no modelUrl
    const args = [item.dimensions?.width || 1, item.dimensions?.height || 1, item.dimensions?.length || 1];

    return (
        <group>
            <TransformControls
                object={selected ? undefined : null}
                mode="translate"
                onObjectChange={(e) => {
                    if (onTransform && e?.target?.object) {
                        onTransform(item.id, e.target.object.position, e.target.object.rotation);
                    }
                }}
                enabled={selected}
                showX={selected} showY={selected} showZ={selected}
            >
                <mesh
                    position={item.position}
                    rotation={item.rotation}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.id);
                    }}
                    castShadow
                >
                    <boxGeometry args={args} />
                    <meshStandardMaterial color={item.color || "orange"} />
                </mesh>
            </TransformControls>
        </group>
    );
};

const SceneContent = ({ roomDimensions, items, onUpdateItem, selectedId, onSelect }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <RoomMesh {...roomDimensions} />
            {items.map(item => (
                <DraggableItem
                    key={item.id}
                    item={item}
                    onTransform={(id, pos, rot) => onUpdateItem(id, pos, rot)}
                    selected={selectedId === item.id}
                    onSelect={onSelect}
                />
            ))}
            <OrbitControls makeDefault />
        </>
    );
};


const Scene = ({ roomDimensions, items, onUpdateItem, onDropItem }) => {
    const [selectedId, setSelectedId] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        // Calculate drop position in 3D space is complex without raycasting from mouse event.
        // For MVP, we drop at center (0,0,0) or slightly offset.
        // A better approach requires useThree raycaster access which is tricky outside Canvas.
        // We'll rely on parent App having handled the data transfer, but we need to know WHERE.
        // Since this div wraps the canvas, we can't easily get 3D coords here.
        // We will let the App handle the "add" logic, assuming drop happens on the canvas element.
        // The onDrop passed here is for the wrapper Div.
        onDropItem();
    };

    return (
        <div
            className="w-full h-full bg-gray-900"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => setSelectedId(null)}
        >
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
                <SceneContent
                    roomDimensions={roomDimensions}
                    items={items}
                    onUpdateItem={onUpdateItem}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            </Canvas>
        </div>
    );
};

export default Scene;
