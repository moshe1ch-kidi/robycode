import React from 'react';
import { Grid, Environment as DreiEnvironment, ContactShadows, Text } from '@react-three/drei';
import '../types';

const SimulationEnvironment: React.FC = () => {
  return (
    <>
      <DreiEnvironment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Grid Pattern */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionSize={5} 
        cellSize={1} 
        sectionColor="#9ca3af" 
        cellColor="#e5e7eb" 
      />

      <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
      
      {/* A simple track line to follow - The Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.01, 5]}>
        <ringGeometry args={[4, 5, 64]} />
        <meshBasicMaterial color="black" />
      </mesh>
      
      {/* THE WALL (Physical Obstacle for Touch Sensor) */}
      {/* Logic in App.tsx detects touch at x < -4. We place the visual wall at x = -5 with width 1 (face at -4.5) */}
      <group position={[-5, 0.5, 0]}>
        <mesh receiveShadow castShadow>
           <boxGeometry args={[1, 1, 30]} /> {/* Long wall along Z axis */}
           <meshStandardMaterial color="#ef4444" roughness={0.2} />
        </mesh>
        
        {/* Striped hazard pattern on top */}
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[1, 30]} />
            <meshBasicMaterial color="#b91c1c" />
        </mesh>

        {/* Text Label */}
        <Text
            position={[0.6, 1, 0]} // Slightly in front of the wall
            rotation={[0, Math.PI / 2, 0]} // Facing the center of arena
            fontSize={0.8}
            color="#b91c1c"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="white"
        >
            קיר / Wall
        </Text>
      </group>

    </>
  );
};

export default SimulationEnvironment;