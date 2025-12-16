import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
// Icon removed as it is now part of the cursor
// import { Pipette } from 'lucide-react';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

// Returns the Decimal representation of the HEX color at the position
const getDecimalColorAtPosition = (x: number, z: number) => {
    // 1. Check the Ring (Black)
    const centerX = 5;
    const centerZ = 5;
    
    const dx = x - centerX;
    const dz = z - centerZ;
    const distFromRingCenter = Math.sqrt(dx*dx + dz*dz);
    
    // Ring geometry args are [4, 5, 64]
    if (distFromRingCenter >= 4 && distFromRingCenter <= 5) {
        return 0; // Black
    }
    
    // 2. Check the Wall Base (Black)
    // Rect bounds: x [-6, -4], z [0, 10]
    if (x >= -6 && x <= -4 && z >= 0 && z <= 10) {
        return 0; // Black
    }

    // 3. Floor Color
    // Environment floor is #f0f0f0
    return 15790320; 
};

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);

    const calculateColor = (point: Vector3) => {
        const val = getDecimalColorAtPosition(point.x, point.z);
        // Convert to Hex String #RRGGBB
        return "#" + val.toString(16).toUpperCase().padStart(6, '0');
    };

    const handlePointerMove = (e: any) => {
        e.stopPropagation();
        const point = e.point;
        setCursorPos(point);
        
        const hexString = calculateColor(point);
        onColorHover(hexString);
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        const point = e.point;
        const hexString = calculateColor(point);
        
        // Trigger selection (which will likely close the tool in App.tsx)
        onColorSelect(hexString);
    };

    const handlePointerOut = () => {
        setCursorPos(null);
    };

    return (
        <group>
            {/* Interaction Plane */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.03, 0]} 
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Cursor Indicator */}
            {cursorPos && (
                <group position={cursorPos}>
                    {/* Visual Ring on Floor - Helps seeing exactly where we pick */}
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.3, 0.4, 32]} />
                        <meshBasicMaterial color="#ec4899" />
                    </mesh>

                    {/* Floating Text Label */}
                    <Html position={[0, 0.6, 0]} center style={{ pointerEvents: 'none' }}>
                         <div className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap">
                            CLICK TO PICK
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;