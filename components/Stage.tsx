
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RobotState, Mission, Obstacle } from '../types';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../constants';

interface StageProps {
  robotState: RobotState;
  currentMission?: Mission;
  activeObstacles?: Obstacle[];
  onObstacleClick?: (id: string) => void;
  isMeasuring?: boolean;
}

// 3D Robot Component - EV3 Style
const Robot3D: React.FC<{ state: RobotState }> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((r3fState, delta) => {
    if (groupRef.current) {
      // Map 2D coordinates to 3D:
      // Scale: 10 units in 2D = 1 unit in 3D
      const targetX = state.x / 10;
      const targetZ = -state.y / 10;
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.1);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
      
      const targetRotation = (state.rotation * Math.PI) / 180;
      // Removed negative sign from targetRotation to match 3D coordinate system mapping
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.1);
    }
  });

  return (
    <group ref={groupRef} scale={[1.3, 1.3, 1.3]}>
      {/* --- EV3 Intelligent Brick (Head) --- */}
      <group position={[-0.2, 1.8, 0]}> 
        <mesh castShadow>
          <boxGeometry args={[2.2, 1.0, 1.8]} />
          <meshStandardMaterial color="#cbd5e1" /> 
        </mesh>
        <mesh position={[0.2, 0.51, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[1.2, 1.0]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0.2, 0.52, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshStandardMaterial color="#bef264" />
        </mesh>
        <mesh position={[0.8, 0.52, 0]}>
           <boxGeometry args={[0.4, 0.1, 1.0]} />
           <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[1.11, 0, 0]} rotation={[0, Math.PI/2, 0]}>
           <planeGeometry args={[1.6, 0.8]} />
           <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>

      {/* --- Motors --- */}
      <group position={[0, 0.9, 0]}>
        <mesh position={[0, 0, 0.7]} castShadow>
           <boxGeometry args={[1.6, 1.2, 0.7]} />
           <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0.4, 0, 0.7]}>
           <boxGeometry args={[0.8, 1.25, 0.75]} /> 
           <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0, 0, -0.7]} castShadow>
           <boxGeometry args={[1.6, 1.2, 0.7]} />
           <meshStandardMaterial color="#94a3b8" />
        </mesh>
         <mesh position={[0.4, 0, -0.7]}>
           <boxGeometry args={[0.8, 1.25, 0.75]} />
           <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      {/* --- Wheels --- */}
      <group position={[0, 0.9, 1.2]}>
        <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.5, 32]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.26]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>
      <group position={[0, 0.9, -1.2]}>
        <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.5, 32]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, -0.26]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* --- Frame --- */}
      <mesh position={[1.4, 0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 2.6]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.8, 0.4, 1.0]} castShadow>
        <boxGeometry args={[1.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.8, 0.4, -1.0]} castShadow>
        <boxGeometry args={[1.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-0.6, 0.6, 0]} castShadow>
         <boxGeometry args={[1.4, 0.15, 0.4]} />
         <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* --- Sensors --- */}
      <group position={[1.2, 1.5, 0]}> 
         <mesh>
            <boxGeometry args={[0.4, 0.5, 1.2]} />
            <meshStandardMaterial color="#111827" />
         </mesh>
         <mesh position={[0.21, 0, 0.3]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.1]} />
            <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.5} />
         </mesh>
         <mesh position={[0.21, 0, -0.3]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.1]} />
            <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.5} />
         </mesh>
      </group>

      {/* --- Rear Wheel --- */}
      <group position={[-1.2, 0.2, 0]}>
        <mesh position={[0, 0.3, 0]}>
           <cylinderGeometry args={[0.15, 0.15, 0.6]} />
           <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh castShadow position={[0, 0.1, 0]}>
           <sphereGeometry args={[0.3]} />
           <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
};

// Component to render mission objectives
const MissionOverlay: React.FC<{ mission: Mission }> = ({ mission }) => {
  if (mission.targetX === undefined) return null;

  const xPos = mission.targetX / 10;
  const zPos = -(mission.targetY || 0) / 10; // Y in 2D is -Z in 3D
  
  // Tolerance width in 3D
  const width = (mission.tolerance * 2) / 10; 
  const length = 40; // Spans across the grid
  const rot = (mission.finishLineRotation || 0) * (Math.PI / 180);

  return (
    <group position={[xPos, 0.05, zPos]} rotation={[0, -rot, 0]}>
      {/* Target Zone Floor Marking */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.3} />
      </mesh>
      
      {/* Finish Line Text */}
      <Text 
        position={[0, 4, -15]} 
        color="#ef4444" 
        fontSize={3}
        anchorX="center"
        anchorY="middle"
        rotation={[0, -Math.PI/2, 0]} // Face the camera mostly?
      >
        FINISH
      </Text>
       <Text 
        position={[0, 4, 15]} 
        color="#ef4444" 
        fontSize={3}
        anchorX="center"
        anchorY="middle"
        rotation={[0, -Math.PI/2, 0]}
      >
        FINISH
      </Text>

      {/* Dotted Lines for tolerance boundary */}
      <mesh position={[-width/2, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[0.2, length]} />
         <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[width/2, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[0.2, length]} />
         <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  )
}

const Obstacle3D: React.FC<{ obstacle: Obstacle, onClick?: (id: string) => void }> = ({ obstacle, onClick }) => {
    const [hovered, setHovered] = useState(false);
    
    // Scale 10 2D units = 1 3D unit
    const width = obstacle.width / 10;
    const depth = obstacle.height / 10; // Y in 2D is depth (Z) in 3D
    const height = 2; // Fixed height for brick
    
    const x = obstacle.x / 10;
    const z = -obstacle.y / 10;
    
    return (
        <group position={[x, height/2, z]} rotation={[0, (obstacle.rotation * Math.PI) / 180, 0]}>
            <mesh 
                onClick={(e) => {
                    e.stopPropagation();
                    if(onClick) onClick(obstacle.id);
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial 
                    color={hovered ? "#f87171" : (obstacle.color || "#b91c1c")} 
                    roughness={0.8}
                />
            </mesh>
            {/* Outline to indicate interactivity */}
            {hovered && (
                <Line 
                    points={[
                        [-width/2, height/2 + 0.1, -depth/2],
                        [width/2, height/2 + 0.1, -depth/2],
                        [width/2, height/2 + 0.1, depth/2],
                        [-width/2, height/2 + 0.1, depth/2],
                        [-width/2, height/2 + 0.1, -depth/2]
                    ]}
                    color="white"
                    lineWidth={2}
                />
            )}
        </group>
    );
};

// Google Earth Style Ruler Tool
const RulerTool: React.FC<{ active: boolean }> = ({ active }) => {
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector3 | null>(null);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    // Clear measurement if tool deactivated
    if (!active) {
        setStartPoint(null);
        setEndPoint(null);
        setHoverPoint(null);
        document.body.style.cursor = 'auto';
    } else {
        document.body.style.cursor = 'crosshair';
    }
  }, [active]);

  if (!active) return null;

  const handleClick = (e: any) => {
      e.stopPropagation();
      const point = e.point;
      
      // If we already have a finished line, clear and start new
      if (startPoint && endPoint) {
          setStartPoint(point);
          setEndPoint(null);
          return;
      }

      if (!startPoint) {
          setStartPoint(point);
      } else {
          setEndPoint(point);
      }
  };

  const handlePointerMove = (e: any) => {
      e.stopPropagation();
      if (startPoint && !endPoint) {
          setHoverPoint(e.point);
      }
  };

  // Determine line coordinates
  let linePoints: THREE.Vector3[] = [];
  let distanceText = "";
  let midPoint = new THREE.Vector3();

  if (startPoint) {
      const currentEnd = endPoint || hoverPoint;
      if (currentEnd) {
          // Lift line slightly off ground to avoid z-fighting
          const p1 = startPoint.clone().setY(0.5);
          const p2 = currentEnd.clone().setY(0.5);
          linePoints = [p1, p2];
          
          // Calculate distance in Simulation Units (cm)
          // 1 ThreeJS unit = 10 Simulation Units
          const dist3D = p1.distanceTo(p2);
          const distCm = Math.round(dist3D * 10);
          distanceText = `${distCm} cm`;
          
          // Calculate midpoint for label
          midPoint.copy(p1).add(p2).multiplyScalar(0.5).add(new THREE.Vector3(0, 2, 0));
      }
  }

  return (
      <group>
          {/* Invisible plane to catch clicks specifically for the ruler */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.05, 0]} 
            onClick={handleClick}
            onPointerMove={handlePointerMove}
            visible={false} 
          >
              <planeGeometry args={[1000, 1000]} />
              <meshBasicMaterial />
          </mesh>

          {/* Markers */}
          {startPoint && (
              <mesh position={[startPoint.x, 0.5, startPoint.z]}>
                  <sphereGeometry args={[0.3]} />
                  <meshBasicMaterial color="#fbbf24" />
              </mesh>
          )}

          {endPoint && (
              <mesh position={[endPoint.x, 0.5, endPoint.z]}>
                  <sphereGeometry args={[0.3]} />
                  <meshBasicMaterial color="#fbbf24" />
              </mesh>
          )}

          {/* Connection Line */}
          {linePoints.length > 0 && (
              <>
                <Line 
                    points={linePoints} 
                    color="#fbbf24" 
                    lineWidth={3} 
                    dashed={!endPoint} 
                    dashScale={!endPoint ? 2 : undefined}
                />
                <Text 
                    position={midPoint} 
                    fontSize={2.5} 
                    color="#fbbf24" 
                    anchorX="center" 
                    anchorY="middle"
                    backgroundColor="rgba(0,0,0,0.5)"
                    padding={0.2}
                >
                    {distanceText}
                </Text>
              </>
          )}
      </group>
  );
};

const Stage: React.FC<StageProps> = ({ robotState, currentMission, activeObstacles = [], onObstacleClick, isMeasuring = false }) => {
  const darkGray = "#334155"; 

  return (
    <div className={`w-full h-full relative ${isMeasuring ? 'cursor-crosshair' : ''}`}>
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={[darkGray]} />
        
        <PerspectiveCamera makeDefault position={[-10, 40, 40]} fov={50} />
        
        <ambientLight intensity={2.0} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        
        <group>
          <Grid 
            args={[100, 100]} 
            cellSize={2} 
            cellThickness={1} 
            cellColor="#64748b" 
            sectionSize={10} 
            sectionThickness={1.5} 
            sectionColor="#94a3b8" 
            fadeDistance={60} 
            infiniteGrid 
          />
          
          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color={darkGray} />
          </mesh>
          
          {/* Start Line */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[-20, 0.02, 0]}>
             <planeGeometry args={[1, 40]} />
             <meshStandardMaterial color="#22c55e" transparent opacity={0.6} />
          </mesh>
          <Text position={[-20, 2, 15]} color="#4ade80" fontSize={2} rotation={[0, -Math.PI/2, 0]}>START</Text>
        </group>

        {currentMission && <MissionOverlay mission={currentMission} />}

        {/* Render Obstacles */}
        {activeObstacles.map(obs => (
            <Obstacle3D key={obs.id} obstacle={obs} onClick={onObstacleClick} />
        ))}

        <Robot3D state={robotState} />
        
        <RulerTool active={isMeasuring} />

        <OrbitControls 
          enabled={!isMeasuring} // Disable orbit when measuring to avoid dragging
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={10}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
};

export default Stage;
