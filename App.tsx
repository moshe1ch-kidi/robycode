import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Play, RotateCcw, Code2 } from 'lucide-react';
import BlocklyEditor from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState } from './types';
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';

// Constants for simulation
const SPEED_MULTIPLIER = 0.05; // Visual speed

// --- SIMULATION LOGIC ---
// Extracted outside component to be used by both the dashboard and the execution API
const calculateSensorReadings = (x: number, z: number, rotation: number) => {
    // 1. Gyro
    const gyro = Math.round(rotation % 360);

    // 2. Touch
    // Wall is at -5. If x < -4, we are touching.
    const isTouching = x < -4;

    // 3. Distance (Ultrasonic)
    // Wall at X = -5.
    // Normalized Rotation logic to see if we are facing the wall
    const normalizedRot = ((rotation % 360) + 360) % 360;
    
    let distance = 255;
    // Facing roughly Left (270 or -90) +/- 20 degrees
    if (normalizedRot > 250 && normalizedRot < 290) {
        const distToWall = Math.abs(x - (-5));
        distance = Math.round(distToWall * 10); // Convert to "cm" scale
    }

    // 4. Color
    // The ring in Environment.tsx is at position [5, 0.01, 5]
    const centerX = 5;
    const centerZ = 5;
    
    const dx = x - centerX;
    const dz = z - centerZ;
    const distFromRingCenter = Math.sqrt(dx*dx + dz*dz);
    
    let color = "white";
    // Ring geometry args are [4, 5, 64] (inner, outer, segments)
    if (distFromRingCenter >= 4 && distFromRingCenter <= 5) {
        color = "black";
    }
    
    // Also check the wall base at x=-5, z=5 (Plane 2x10)
    // Rect bounds: x [-6, -4], z [0, 10]
    if (x >= -6 && x <= -4 && z >= 0 && z <= 10) {
        color = "black";
    }

    return { gyro, isTouching, distance, color };
};


const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  // Numpad State
  const [numpadConfig, setNumpadConfig] = useState({
    isOpen: false,
    value: 0 as string | number,
    onConfirm: (val: number) => {}
  });

  // Expose showNumpad to window for Blockly
  useEffect(() => {
    window.showBlocklyNumpad = (initialValue, onConfirm) => {
        setNumpadConfig({
            isOpen: true,
            value: initialValue,
            onConfirm: (val) => {
                onConfirm(val);
                setNumpadConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };
  }, []);

  // Initial state
  const initialState: RobotState = {
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    speed: 100, // Default speed 100%
    ledLeftColor: 'black',
    ledRightColor: 'black',
    isMoving: false,
  };

  const [robotState, setRobotState] = useState<RobotState>(initialState);
  
  // We use refs for the execution loop to access latest state without closures
  const robotRef = useRef(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive sensor values for the Dashboard
  const sensorReadings = useMemo(() => {
    return calculateSensorReadings(robotState.x, robotState.z, robotState.rotation);
  }, [robotState.x, robotState.z, robotState.rotation]);

  // Sync ref with state for rendering
  const updateRobotState = (newState: Partial<RobotState>) => {
    const updated = { ...robotRef.current, ...newState };
    robotRef.current = updated;
    setRobotState(updated);
  };

  // --- ROBOT API EXPOSED TO BLOCKLY CODE ---
  const createRobotApi = (signal: AbortSignal) => {
    const checkAbort = () => {
        if (signal.aborted) throw new Error("Simulation aborted");
    };

    return {
      setSpeed: async (speed: number) => {
          checkAbort();
          const clampedSpeed = Math.max(0, Math.min(100, speed));
          updateRobotState({ speed: clampedSpeed });
      },

      move: async (distanceCm: number) => {
        checkAbort();
        updateRobotState({ isMoving: true });
        
        // Calculate duration based on speed
        const currentSpeed = robotRef.current.speed;
        const speedFactor = Math.max(1, currentSpeed) / 100;
        
        const duration = (Math.abs(distanceCm) * 20) / speedFactor;

        const steps = 30; // smooth steps
        const stepTime = duration / steps;
        
        const distPerStep = (distanceCm * 0.1) / steps; // Scaling factor for 3D world
        
        for (let i = 0; i < steps; i++) {
            checkAbort();
            await new Promise(r => setTimeout(r, stepTime));
            
            const rad = (robotRef.current.rotation * Math.PI) / 180;
            const dx = Math.sin(rad) * distPerStep;
            const dz = Math.cos(rad) * distPerStep;
            
            // Basic collision with walls (Soft limits)
            let newX = robotRef.current.x + dx;
            let newZ = robotRef.current.z + dz;

            updateRobotState({
                x: newX,
                z: newZ
            });
        }
        updateRobotState({ isMoving: false });
      },

      turn: async (angleDeg: number) => {
        checkAbort();
        updateRobotState({ isMoving: true });
        
        const currentSpeed = robotRef.current.speed;
        const speedFactor = Math.max(1, currentSpeed) / 100;

        const duration = (Math.abs(angleDeg) * 10) / speedFactor;

        const steps = 20;
        const stepTime = duration / steps;
        const angPerStep = angleDeg / steps;

        for (let i = 0; i < steps; i++) {
            checkAbort();
            await new Promise(r => setTimeout(r, stepTime));
            updateRobotState({
                rotation: robotRef.current.rotation + angPerStep
            });
        }
        updateRobotState({ isMoving: false });
      },

      setLed: (side: string, color: string) => {
          checkAbort();
          if (side === 'left' || side === 'both') updateRobotState({ ledLeftColor: color });
          if (side === 'right' || side === 'both') updateRobotState({ ledRightColor: color });
      },
      
      wait: async (ms: number) => {
          checkAbort();
          await new Promise(r => setTimeout(r, ms));
      },

      // --- SENSOR SIMULATION (Using Shared Logic) ---
      
      getDistance: async () => {
         checkAbort();
         const { x, z, rotation } = robotRef.current;
         return calculateSensorReadings(x, z, rotation).distance;
      },

      getTouch: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          return calculateSensorReadings(x, z, rotation).isTouching;
      },

      getGyro: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          return calculateSensorReadings(x, z, rotation).gyro;
      },

      getColor: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          return calculateSensorReadings(x, z, rotation).color;
      }
    };
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Reset abort controller
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const robot = createRobotApi(abortControllerRef.current.signal);

    try {
      // Execute the generated code
      // We wrap in an async function to allow 'await' in top level of block code
      const runFunc = new Function('robot', `return (async () => { ${generatedCode} })();`);
      await runFunc(robot);
    } catch (e: any) {
      if (e.message !== "Simulation aborted") {
          console.error("Runtime error:", e);
          alert("Error running code: " + e.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    updateRobotState(initialState);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Virtual Robotics Lab</h1>
        </div>
        <div className="text-sm text-slate-400">
           Version 1.0 - VEX/EV3 Style
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* BLOCKLY EDITOR (Left side in LTR) */}
        {/* Changed border-l to border-r to put separator on right side of editor */}
        <div className="w-1/2 border-r border-slate-300 relative flex flex-col">
            <div className="bg-slate-100 p-2 flex gap-2 border-b border-slate-300 shadow-sm">
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors ${
                        isRunning 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    <Play size={18} />
                    Run Program
                </button>
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold transition-colors"
                >
                    <RotateCcw size={18} />
                    Reset
                </button>
            </div>
            <div className="flex-1 relative">
                <BlocklyEditor onCodeChange={setGeneratedCode} />
            </div>
        </div>

        {/* 3D VIEWPORT (Right side in LTR) */}
        <div className="w-1/2 relative bg-gray-900">
            {/* Top Info Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 text-white p-3 rounded backdrop-blur-sm text-left">
                <p className="text-xs uppercase tracking-wider opacity-70">Robot State</p>
                <div className="font-mono text-sm">
                    X: {robotState.x.toFixed(2)}<br/>
                    Z: {robotState.z.toFixed(2)}<br/>
                    Speed: {robotState.speed}%
                </div>
            </div>

            {/* SENSOR DASHBOARD (Bottom Overlay) */}
            <SensorDashboard 
                distance={sensorReadings.distance}
                isTouching={sensorReadings.isTouching}
                gyroAngle={sensorReadings.gyro}
                detectedColor={sensorReadings.color}
            />

            <Canvas shadows camera={{ position: [5, 8, 8], fov: 45 }}>
                <SimulationEnvironment />
                <Robot3D state={robotState} />
                <OrbitControls makeDefault minDistance={3} maxDistance={20} />
            </Canvas>
        </div>

        {/* NUMPAD OVERLAY */}
        <Numpad 
            isOpen={numpadConfig.isOpen}
            initialValue={numpadConfig.value}
            onClose={() => setNumpadConfig(prev => ({ ...prev, isOpen: false }))}
            onConfirm={numpadConfig.onConfirm}
        />

      </div>
    </div>
  );
};

export default App;