import React from 'react';
import { Grid, Environment as DreiEnvironment, ContactShadows } from '@react-three/drei';
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
      
      {/* A simple track line to follow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.01, 5]}>
        <ringGeometry args={[4, 5, 64]} />
        <meshBasicMaterial color="black" />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.01, 5]}>
        <planeGeometry args={[2, 10]} />
        <meshBasicMaterial color="black" />
      </mesh>

    </>
  );
};

export default SimulationEnvironment;