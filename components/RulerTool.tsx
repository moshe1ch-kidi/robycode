import React, { useState } from 'react';
import { Html, Line } from '@react-three/drei';
import { Vector3 } from 'three';

const RulerTool: React.FC = () => {
    const [start, setStart] = useState<Vector3 | null>(null);
    const [end, setEnd] = useState<Vector3 | null>(null);
    const [isMeasuring, setIsMeasuring] = useState(false);

    const handlePointerMove = (e: any) => {
        if (isMeasuring && start) {
            e.stopPropagation();
            // Update the end point dynamically as we move the mouse
            setEnd(e.point);
        }
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        const point = e.point;

        if (!isMeasuring) {
            // STEP 1: Start a new measurement
            setStart(point);
            setEnd(point); // Initialize end at start position
            setIsMeasuring(true);
        } else {
            // STEP 2: Finish measurement
            setEnd(point);
            setIsMeasuring(false);
        }
    };

    // Calculate distance
    // In our simulation: 1 ThreeJS unit = 10cm
    const distance = start && end ? start.distanceTo(end) : 0;
    const distanceCm = (distance * 10).toFixed(1);

    return (
        <group>
            {/* Interaction Plane - Handles Clicks and Mouse Movement */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.02, 0]} 
                onClick={handleClick}
                onPointerMove={handlePointerMove}
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Helper UI Text (Top Center) */}
            <Html position={[0, 0, 0]} fullscreen style={{pointerEvents: 'none', zIndex: 0}}>
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className={`px-4 py-2 rounded-full shadow-lg font-bold text-sm transition-colors ${
                        isMeasuring ? 'bg-yellow-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                        {!isMeasuring && !start ? "Click to start measuring" : 
                         isMeasuring ? "Move to measure, Click to finish" : 
                         "Click anywhere to start new measurement"}
                    </div>
                </div>
            </Html>

            {/* Start Marker (Green) */}
            {start && (
                <mesh position={start}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
                    <Html position={[0, 0.3, 0]}>
                        <div className="bg-green-600 text-white text-[10px] px-1 rounded font-bold shadow-sm">Start</div>
                    </Html>
                </mesh>
            )}

            {/* End Marker (Red - Visible when moving or finished) */}
            {end && (
                <mesh position={end}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
                </mesh>
            )}

            {/* The Line and Distance Label */}
            {start && end && (
                <>
                    <Line
                        points={[start, end]}
                        color={isMeasuring ? "#eab308" : "black"} // Yellow while measuring, Black when done
                        lineWidth={3}
                        dashed={isMeasuring} // Dashed while measuring
                        dashScale={10}
                        gapSize={5}
                    />
                    
                    {/* Distance Label (Always visible if distance > 0) */}
                    {(distance > 0.01) && (
                        <Html position={new Vector3().lerpVectors(start, end, 0.5)} zIndexRange={[100, 0]}>
                            <div className={`px-2 py-1 rounded-md shadow-lg font-mono font-bold text-sm whitespace-nowrap transform -translate-y-8 border-2 ${
                                isMeasuring 
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-800' 
                                : 'bg-white border-blue-500 text-blue-800'
                            }`}>
                                {distanceCm} cm
                            </div>
                        </Html>
                    )}
                </>
            )}
        </group>
    );
};

export default RulerTool;