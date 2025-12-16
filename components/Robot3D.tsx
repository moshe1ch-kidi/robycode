import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, BoxGeometry } from 'three';
import { RobotState } from '../types';

interface Robot3DProps {
  state: RobotState;
}

const LegoWheel = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => {
  return (
    <group position={position} rotation={rotation || [0, 0, Math.PI / 2]}>
      {/* Tire Main Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 40]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      
      {/* Tire Treads (Visual Ridges) */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI/2, 0, 0]} position={[0, (i - 2) * 0.08, 0]}>
             <torusGeometry args={[0.6, 0.02, 16, 48]} />
             <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      
      {/* Rim (Grey Hub) */}
      <mesh position={[0, 0, 0]}>
         <cylinderGeometry args={[0.35, 0.35, 0.41, 32]} />
         <meshStandardMaterial color="#999" roughness={0.5} />
      </mesh>

      {/* Rim Detail - Holes Simulation (Dark circles on the face) */}
      {[1, -1].map((side) => (
        <group key={side} position={[0, side * 0.21, 0]} rotation={[side === 1 ? 0 : Math.PI, 0, 0]}>
           {/* Center Axle Hole */}
           <mesh position={[0, 0.001, 0]} rotation={[Math.PI/2, 0, 0]}>
               <circleGeometry args={[0.08, 16]} />
               <meshStandardMaterial color="#111" />
           </mesh>
           {/* 6 Holes around */}
           {[...Array(6)].map((_, i) => {
               const angle = (i / 6) * Math.PI * 2;
               const radius = 0.2;
               return (
                   <mesh 
                    key={i} 
                    position={[Math.cos(angle) * radius, 0.001, Math.sin(angle) * radius]} 
                    rotation={[Math.PI/2, 0, 0]}
                   >
                       <circleGeometry args={[0.08, 16]} />
                       <meshStandardMaterial color="#222" />
                   </mesh>
               );
           })}
        </group>
      ))}
    </group>
  );
};

const CasterWheel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Metal Ball */}
      <mesh castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Housing Structure */}
      <group position={[0, 0.1, 0]}>
        {/* The Cup/Socket holding the ball */}
        <mesh position={[0, 0.05, 0]}>
           <cylinderGeometry args={[0.22, 0.22, 0.2, 32]} /> 
           <meshStandardMaterial color="#444" roughness={0.5} />
        </mesh>
        
        {/* Rounded top of the socket */}
        <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#444" roughness={0.5} />
        </mesh>

        {/* Support Block connecting to chassis */}
        {/* Chassis bottom is at Y = 0 (relative to Robot center at 0.5) if Robot center is 0.5. 
            Caster position passed is [0, -0.4, -0.8]. 
            So relative to Caster, Chassis bottom is at Y = 0.4.
        */}
        <mesh position={[0, 0.3, 0]}>
           <boxGeometry args={[0.25, 0.4, 0.35]} />
           <meshStandardMaterial color="#444" roughness={0.5} />
        </mesh>

        {/* Visual Connector Holes (Technic style) */}
        <mesh position={[0.126, 0.35, 0]} rotation={[0, Math.PI/2, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-0.126, 0.35, 0]} rotation={[0, -Math.PI/2, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
};

const LegoLight = ({ position, color }: { position: [number, number, number], color: string }) => {
  const isOff = color === 'black';
  const displayColor = isOff ? '#555' : color;
  const intensity = isOff ? 0 : 3;

  // Glass properties logic
  const glassColor = isOff ? "#aaddff" : color;
  const glassOpacity = isOff ? 0.25 : 0.6; // Make it a bit more solid when lit
  const glassEmissive = isOff ? "#000000" : color;
  const glassEmissiveIntensity = isOff ? 0 : 0.5;

  return (
    <group position={position}>
      {/* Black Base */}
      <mesh position={[0, 0.05, 0]} castShadow>
         <boxGeometry args={[0.25, 0.1, 0.25]} />
         <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      
      {/* Technic Holes in Base */}
      <mesh position={[0, 0.05, 0.126]} rotation={[Math.PI/2, 0, 0]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial color="#111" />
      </mesh>

      {/* Glass Cube Housing */}
      <mesh position={[0, 0.25, 0]} castShadow>
         <boxGeometry args={[0.25, 0.3, 0.25]} />
         <meshStandardMaterial 
            color={glassColor} 
            transparent 
            opacity={glassOpacity} 
            roughness={0.2} 
            metalness={0.1}
            emissive={glassEmissive}
            emissiveIntensity={glassEmissiveIntensity}
         />
      </mesh>
      
      {/* Glass Edges (Visual aid for transparency) */}
       <lineSegments position={[0, 0.25, 0]}>
          <edgesGeometry args={[new BoxGeometry(0.25, 0.3, 0.25)] as any} /> 
          <meshBasicMaterial color={isOff ? "#88ccff" : "#ffffff"} transparent opacity={0.3} />
       </lineSegments>

      {/* Internal Bulb / Light Source */}
      <mesh position={[0, 0.2, 0]}>
         <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
         <meshStandardMaterial 
            color={displayColor} 
            emissive={displayColor}
            emissiveIntensity={intensity}
         />
      </mesh>
      
      {/* Top Ridges for Glass Block Look */}
      {[...Array(3)].map((_, i) => (
         <mesh key={i} position={[0, 0.401, (i-1)*0.06]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.2, 0.02]} />
             <meshBasicMaterial color="#fff" transparent opacity={0.3} />
         </mesh>
      ))}
    </group>
  );
};

const EV3TouchSensor = ({ position }: { position: [number, number, number] }) => {
    return (
        <group position={position}>
            {/* Main Body (White/Light Grey Box) */}
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.4, 0.5, 0.6]} />
                <meshStandardMaterial color="#DDDDDD" roughness={0.4} />
            </mesh>
            
            {/* Front Face (Darker Grey Panel) */}
            <mesh position={[0, 0.25, 0.301]}>
                <boxGeometry args={[0.38, 0.48, 0.02]} />
                <meshStandardMaterial color="#888888" roughness={0.6} />
            </mesh>

            {/* Recessed Circle for Button */}
            <mesh position={[0, 0.25, 0.312]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.15, 32]} />
                <meshStandardMaterial color="#555555" />
            </mesh>

            {/* Red Cross Axle Button */}
            <group position={[0, 0.25, 0.34]}>
                {/* Horizontal Bar of Cross */}
                <mesh>
                    <boxGeometry args={[0.22, 0.06, 0.04]} />
                    <meshStandardMaterial color="#D32F2F" />
                </mesh>
                {/* Vertical Bar of Cross */}
                <mesh>
                    <boxGeometry args={[0.06, 0.22, 0.04]} />
                    <meshStandardMaterial color="#D32F2F" />
                </mesh>
                {/* Center Nub */}
                <mesh rotation={[Math.PI/2, 0, 0]}>
                     <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
                     <meshStandardMaterial color="#B71C1C" />
                </mesh>
            </group>

            {/* Side Detail (Indent) */}
            <mesh position={[0.201, 0.25, 0]}>
                <boxGeometry args={[0.02, 0.3, 0.4]} />
                <meshStandardMaterial color="#CCCCCC" />
            </mesh>
            
             {/* Bottom Connector Block (Dark Grey Technic beam style) */}
             <group position={[0, -0.1, -0.1]}>
                <mesh>
                    <boxGeometry args={[0.38, 0.2, 0.6]} />
                    <meshStandardMaterial color="#555555" />
                </mesh>
                {/* Technic Holes Side */}
                {[0.2, 0, -0.2].map((offset, i) => (
                    <mesh key={i} position={[0.2, 0, offset]} rotation={[0, 0, Math.PI/2]}>
                         <circleGeometry args={[0.06, 16]} />
                         <meshStandardMaterial color="#222" />
                    </mesh>
                ))}
             </group>

        </group>
    );
};


const Robot3D: React.FC<Robot3DProps> = ({ state }) => {
  const groupRef = useRef<Group>(null);
  
  // Smoothly interpolate position for visual fluidity
  useFrame(() => {
    if (groupRef.current) {
      // Linear interpolation (lerp) for smooth movement
      groupRef.current.position.lerp(new Vector3(state.x, 0.6, state.z), 0.1);
      
      // Rotation interpolation
      // FIXED: Removed negation. Positive rotation (CCW) in state matches ThreeJS rotation.y
      // This ensures the robot's "Nose" (Touch sensor at +Z) matches the movement direction calculation.
      const targetRotation = state.rotation * (Math.PI / 180); 
      const currentRotation = groupRef.current.rotation.y;
      
      // Simple easing
      groupRef.current.rotation.y = currentRotation + (targetRotation - currentRotation) * 0.1;
    }
  });

  const materialGrey = <meshStandardMaterial color="#A0A0A0" roughness={0.5} />;
  const materialDark = <meshStandardMaterial color="#333333" roughness={0.8} />;
  const materialWhite = <meshStandardMaterial color="#EEEEEE" roughness={0.2} />;
  const materialRedAccents = <meshStandardMaterial color="#D32F2F" />;
  const materialBlueAccents = <meshStandardMaterial color="#1976D2" />;
  const materialMetal = <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />;

  return (
    <group ref={groupRef} dispose={null}>
      {/* --- CHASSIS (Brick) --- */}
      {/* Main programmable brick body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 2]} />
        {materialWhite}
      </mesh>
      
      {/* Screen area on brick */}
      <mesh position={[0, 1.01, 0.2]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Buttons on brick */}
      <mesh position={[0, 1.01, -0.4]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* --- WHEELS --- */}
      {/* Front Left */}
      <LegoWheel position={[-0.9, 0, 0.5]} />

      {/* Front Right */}
      <LegoWheel position={[0.9, 0, 0.5]} />

      {/* Rear Caster Wheel (Ball + Housing) */}
      <CasterWheel position={[0, -0.4, -0.8]} />

      {/* --- LEDS --- */}
      {/* Front Left Corner LED */}
      <LegoLight position={[-0.6, 1.0, 0.9]} color={state.ledLeftColor} />

      {/* Front Right Corner LED */}
      <LegoLight position={[0.6, 1.0, 0.9]} color={state.ledRightColor} />

      {/* --- SENSORS (EV3 Style) --- */}
      
      {/* 5. Color Sensor (Down facing) */}
      <group position={[0, -0.3, 0.8]}>
         {/* Mount */}
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.2, 0.4, 0.2]} />
            {materialGrey}
        </mesh>
        {/* Sensor Head */}
        <mesh position={[0, -0.1, 0]}>
             <boxGeometry args={[0.4, 0.2, 0.4]} />
             {materialDark}
        </mesh>
        {/* Lens */}
        <mesh position={[0, -0.21, 0.1]} rotation={[Math.PI/2, 0, 0]}>
             <circleGeometry args={[0.1, 16]} />
             <meshBasicMaterial color="#FF0000" />
        </mesh>
      </group>

      {/* 6. Ultrasonic Sensor (Eyes) - Updated based on EV3 Image */}
      <group position={[0, 0.5, 1.05]}>
         {/* Center Bridge */}
         <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.2]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
         </mesh>

         {/* Two Eye Modules */}
         {[-1, 1].map((side) => (
             <group key={side} position={[side * 0.45, 0, 0.05]}>
                 {/* Outer Housing Cylinder (Dark Grey) */}
                 <mesh rotation={[Math.PI/2, 0, 0]}>
                     <cylinderGeometry args={[0.32, 0.32, 0.3, 32]} />
                     <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
                 </mesh>
                 
                 {/* Inner Dark Recess */}
                 <mesh position={[0, 0, 0.151]} rotation={[Math.PI/2, 0, 0]}>
                     <circleGeometry args={[0.28, 32]} />
                     <meshStandardMaterial color="#111" />
                 </mesh>

                 {/* Red Ring - High Emissive Red */}
                 <mesh position={[0, 0, 0.152]} rotation={[Math.PI/2, 0, 0]}>
                     <ringGeometry args={[0.16, 0.26, 32]} />
                     <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={3} />
                 </mesh>

                 {/* Center Mesh - Dark Reddish Bronze */}
                 <mesh position={[0, 0, 0.16]} rotation={[Math.PI/2, 0, 0]}>
                     <cylinderGeometry args={[0.15, 0.15, 0.02, 32]} />
                     <meshStandardMaterial color="#8B0000" roughness={0.4} metalness={0.5} />
                 </mesh>
             </group>
         ))}
      </group>

      {/* 7. Touch Sensor (Front Bumper) - Updated to EV3 Style */}
      {/* This is the NOSE of the robot, placed at +Z */}
      <EV3TouchSensor position={[0, 0, 1.3]} />

      {/* 8. Gyro Sensor (Above Right Wheel) */}
      <group position={[0.6, 1.1, -0.5]}>
          <mesh>
             <boxGeometry args={[0.4, 0.2, 0.4]} />
             {materialGrey}
          </mesh>
          <mesh position={[0, 0.11, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshBasicMaterial color="#DDD" />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0.08, 0.1, 16]} />
              <meshBasicMaterial color="black" />
          </mesh>
      </group>

    </group>
  );
};

export default Robot3D;