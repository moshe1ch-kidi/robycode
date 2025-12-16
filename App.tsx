import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Play, RotateCcw, Code2, Ruler, Trophy, CheckCircle, X } from 'lucide-react';
import BlocklyEditor from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState } from './types';
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';
import RulerTool from './components/RulerTool';
import ColorPickerTool from './components/ColorPickerTool';
import { CHALLENGES, Challenge, SimulationHistory } from './data/challenges';

// Constants for simulation
const SPEED_MULTIPLIER = 0.05; // Visual speed

// Custom Cursor SVG (Pink Pipette) - Hotspot at bottom left (0, 24)
const DROPPER_CURSOR_URL = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlYzQ4OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiAyMmw1LTUiLz48cGF0aCBkPSJNMTUuNTQgOC40NmE1IDUgMCAxIDAtNy4wNyA3LjA3bDEuNDEgMS40MWEyIDIgMCAwIDAgMi44MyAwbDIuODMtMi44M2EyIDIgMCAwIDAgMC0yLjgzbC0xLjQxLTEuNDF6Ii8+PC9zdmc+') 0 24, crosshair`;

// --- COLOR CALCULATION LOGIC ---
const getDecimalColorAtPosition = (x: number, z: number) => {
    const centerX = 5;
    const centerZ = 5;
    
    const dx = x - centerX;
    const dz = z - centerZ;
    const distFromRingCenter = Math.sqrt(dx*dx + dz*dz);
    
    // Ring geometry args are [4, 5, 64]
    if (distFromRingCenter >= 4 && distFromRingCenter <= 5) {
        return 0; // Black #000000
    }
    
    // Wall Base (Black)
    if (x >= -6 && x <= -4 && z >= 0 && z <= 10) {
        return 0; // Black #000000
    }

    // Floor Color (#f0f0f0)
    return 15790320; 
};

// --- SIMULATION LOGIC ---
const calculateSensorReadings = (x: number, z: number, rotation: number) => {
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);

    // 1. Gyro
    const gyro = Math.round(rotation % 360);

    // 2. Touch Sensor
    // Sensor Tip is at z=1.6 relative to center (Updated from 1.3 to match visual tip)
    // We calculate the world position of the sensor tip
    const touchSensorX = x + sin * 1.6;
    const touchSensorZ = z + cos * 1.6;
    
    // Wall is defined at X [-5.5, -4.5] (Center -5, Width 1). Z is approx infinite ([-15, 15] in visual)
    const wallMinX = -5.5;
    const wallMaxX = -4.5;
    const wallMinZ = -15;
    const wallMaxZ = 15;

    // Check if sensor tip is inside the wall volume
    const isTouching = (
        touchSensorX >= wallMinX && 
        touchSensorX <= wallMaxX && 
        touchSensorZ >= wallMinZ && 
        touchSensorZ <= wallMaxZ
    );

    // 3. Distance (Ultrasonic)
    // Sensor is at z=1.05 relative to center
    const usSensorX = x + sin * 1.05;
    const usSensorZ = z + cos * 1.05;
    
    let distance = 255;
    
    // Raycasting for the Wall at X = -4.5 (The face of the wall)
    // If we are facing somewhat Left (sin < -0.1), we might see the wall
    if (sin < -0.1) { 
        // Ray Equation: P = Origin + t * Dir
        // Wall Plane: x = -4.5
        // -4.5 = usSensorX + t * sin  =>  t = (-4.5 - usSensorX) / sin
        const t = (-4.5 - usSensorX) / sin;
        
        if (t > 0) {
            // Calculate Z at intersection to see if we actually hit the wall geometry
            const intersectZ = usSensorZ + t * cos;
            if (intersectZ >= wallMinZ && intersectZ <= wallMaxZ) {
                // t is in simulation units. 1 unit ~ 10cm.
                const distCm = t * 10; 
                if (distCm < 255) distance = Math.round(distCm);
            }
        }
    }

    // 4. Color Sensor
    // Sensor is at z=0.8 relative to center
    const colorSensorX = x + sin * 0.8;
    const colorSensorZ = z + cos * 0.8;

    const rawDecimalColor = getDecimalColorAtPosition(colorSensorX, colorSensorZ);
    const isDark = rawDecimalColor < 100000;
    const intensity = isDark ? 5 : 100;
    const color = isDark ? "black" : "white";

    return { gyro, isTouching, distance, color, intensity, rawDecimalColor };
};


const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  // Tools State
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [pickerHoverColor, setPickerHoverColor] = useState<string | null>(null);
  
  // Challenge State
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  // Simulation History for Challenge Verification
  const historyRef = useRef<SimulationHistory>({
      maxDistanceMoved: 0,
      touchedWall: false,
      detectedColors: [],
      totalRotation: 0
  });
  
  // Callback when picking color for a Blockly Block
  const blocklyColorCallbackRef = useRef<((color: string) => void) | null>(null);
  
  // Numpad State
  const [numpadConfig, setNumpadConfig] = useState({
    isOpen: false,
    value: 0 as string | number,
    onConfirm: (val: number) => {}
  });

  // Expose Global Functions for Blockly
  useEffect(() => {
    // Numpad
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

    // Color Picker
    window.showBlocklyColorPicker = (onPick) => {
        // Activate the 3D tool
        setIsColorPickerActive(true);
        setIsRulerActive(false); // Disable other tools
        setPickerHoverColor(null);
        // Store callback
        blocklyColorCallbackRef.current = onPick;
    };
  }, []);

  const initialState: RobotState = {
    x: 0,
    y: 0,
    z: 0,
    rotation: 180,
    speed: 100,
    ledLeftColor: 'black',
    ledRightColor: 'black',
    isMoving: false,
  };

  const [robotState, setRobotState] = useState<RobotState>(initialState);
  const robotRef = useRef(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startStateRef = useRef(initialState); // Track start for challenges

  const sensorReadings = useMemo(() => {
    return calculateSensorReadings(robotState.x, robotState.z, robotState.rotation);
  }, [robotState.x, robotState.z, robotState.rotation]);

  const updateRobotState = (newState: Partial<RobotState>) => {
    const updated = { ...robotRef.current, ...newState };
    robotRef.current = updated;
    setRobotState(updated);
  };

  // --- ROBOT API ---
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

      stop: async () => {
          checkAbort();
          updateRobotState({ isMoving: false });
          await new Promise(r => setTimeout(r, 50));
      },

      move: async (distanceCm: number) => {
        checkAbort();
        updateRobotState({ isMoving: true });
        
        const currentSpeed = robotRef.current.speed;
        const speedFactor = Math.max(1, currentSpeed) / 100;
        const duration = (Math.abs(distanceCm) * 20) / speedFactor;

        const stepInterval = 16;
        let steps = Math.ceil(duration / stepInterval);
        if (steps < 1) steps = 1;
        
        const stepTime = duration / steps;
        const distPerStep = (distanceCm * 0.1) / steps; 
        
        for (let i = 0; i < steps; i++) {
            checkAbort();
            await new Promise(r => setTimeout(r, stepTime));
            
            const rad = (robotRef.current.rotation * Math.PI) / 180;
            const dx = Math.sin(rad) * distPerStep;
            const dz = Math.cos(rad) * distPerStep;
            
            let newX = robotRef.current.x + dx;
            let newZ = robotRef.current.z + dz;

            updateRobotState({
                x: newX,
                z: newZ
            });

            // Update History
            const totalDist = Math.sqrt(Math.pow(newX - startStateRef.current.x, 2) + Math.pow(newZ - startStateRef.current.z, 2));
            historyRef.current.maxDistanceMoved = Math.max(historyRef.current.maxDistanceMoved, totalDist);
        }
        updateRobotState({ isMoving: false });
      },

      turn: async (angleDeg: number) => {
        checkAbort();
        updateRobotState({ isMoving: true });
        
        const currentSpeed = robotRef.current.speed;
        const speedFactor = Math.max(1, currentSpeed) / 100;

        const duration = (Math.abs(angleDeg) * 10) / speedFactor;

        const stepInterval = 16;
        let steps = Math.ceil(duration / stepInterval);
        if (steps < 1) steps = 1;
        
        const stepTime = duration / steps;
        const angPerStep = angleDeg / steps;

        for (let i = 0; i < steps; i++) {
            checkAbort();
            await new Promise(r => setTimeout(r, stepTime));
            const newRotation = robotRef.current.rotation + angPerStep;
            updateRobotState({ rotation: newRotation });
            
            // Update History
            historyRef.current.totalRotation += angPerStep;
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

      // Sensors
      getDistance: async () => {
         checkAbort();
         const { x, z, rotation } = robotRef.current;
         return calculateSensorReadings(x, z, rotation).distance;
      },

      getTouch: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          const val = calculateSensorReadings(x, z, rotation).isTouching;
          if (val) historyRef.current.touchedWall = true;
          return val;
      },

      getGyro: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          return calculateSensorReadings(x, z, rotation).gyro;
      },

      getColor: async () => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          const val = calculateSensorReadings(x, z, rotation).color;
          if (!historyRef.current.detectedColors.includes(val)) {
              historyRef.current.detectedColors.push(val);
          }
          return val;
      },

      isTouchingColor: async (targetHex: string) => {
          checkAbort();
          const { x, z, rotation } = robotRef.current;
          const { rawDecimalColor } = calculateSensorReadings(x, z, rotation);
          
          const currentHex = "#" + rawDecimalColor.toString(16).toUpperCase().padStart(6, '0');
          const target = targetHex.toUpperCase();
          const current = currentHex.toUpperCase();
          
          if (target === current) return true;
          if (target === '#FFFFFF' && current === '#F0F0F0') return true;
          if (target === '#000000' && current === '#000000') return true;

          return false;
      },
      
      getCircumference: async () => {
          checkAbort();
          return 3.77;
      }
    };
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setChallengeSuccess(false);
    
    // Reset History for this run
    historyRef.current = {
        maxDistanceMoved: 0,
        touchedWall: false,
        detectedColors: [],
        totalRotation: 0
    };
    startStateRef.current = { ...robotRef.current };

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const robot = createRobotApi(abortControllerRef.current.signal);

    try {
      const runFunc = new Function('robot', `return (async () => { ${generatedCode} })();`);
      await runFunc(robot);
      
      // Check Challenge Success ONLY after normal completion
      if (activeChallenge) {
          const success = activeChallenge.check(startStateRef.current, robotRef.current, historyRef.current);
          if (success) {
              setChallengeSuccess(true);
          }
      }

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
    setChallengeSuccess(false);
  };

  // Tool Toggle Handlers
  const toggleRuler = () => {
      setIsRulerActive(!isRulerActive);
      if (!isRulerActive) {
          setIsColorPickerActive(false); 
          blocklyColorCallbackRef.current = null; // Clear callback if manually closing
      }
      setPickerHoverColor(null);
  };

  const toggleColorPicker = () => {
      setIsColorPickerActive(!isColorPickerActive);
      if (!isColorPickerActive) {
          setIsRulerActive(false); 
          // If manually opened via dashboard, we don't have a block callback
          blocklyColorCallbackRef.current = null;
      }
      setPickerHoverColor(null);
  };

  // Handler when user clicks on 3D floor with picker
  const handleColorPicked = (hex: string) => {
      setPickerHoverColor(hex);
      setIsColorPickerActive(false);
      
      // If this pick was initiated by a Blockly block, send the value back
      if (blocklyColorCallbackRef.current) {
          blocklyColorCallbackRef.current(hex);
          blocklyColorCallbackRef.current = null;
      }
      
      // Also copy to clipboard for good measure
      navigator.clipboard.writeText(hex).then(() => {
         console.log('Color copied:', hex);
      }).catch(err => console.error('Clipboard failed', err));
  };
  
  const handleEvalCode = useCallback(async (codeSnippet: string) => {
      const passiveController = new AbortController();
      const robot = createRobotApi(passiveController.signal);
      
      try {
          const runFunc = new Function('robot', `return (async () => { return ${codeSnippet} })();`);
          const result = await runFunc(robot);
          return result;
      } catch (e) {
          console.error("Eval error", e);
          return "Error";
      }
  }, []);

  const selectChallenge = (c: Challenge) => {
      setActiveChallenge(c);
      setShowChallenges(false);
      handleReset(); // Reset robot to start fresh
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Virtual Robotics Lab</h1>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Challenge Button */}
             <button 
                onClick={() => setShowChallenges(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    activeChallenge ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
             >
                <Trophy size={16} />
                {activeChallenge ? activeChallenge.title : "משימות"}
             </button>

            <div className="text-sm text-slate-400 hidden md:block">
               Version 1.0 - VEX/EV3 Style
            </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* BLOCKLY EDITOR */}
        <div className="w-1/2 border-r border-slate-300 relative flex flex-col">
            <div className="bg-slate-100 p-2 flex gap-2 border-b border-slate-300 shadow-sm overflow-x-auto">
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors whitespace-nowrap ${
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
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold transition-colors whitespace-nowrap"
                >
                    <RotateCcw size={18} />
                    Reset
                </button>
                
                <div className="w-px h-8 bg-slate-300 mx-2 shrink-0"></div>

                <button 
                    onClick={toggleRuler}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors whitespace-nowrap ${
                        isRulerActive
                        ? 'bg-blue-600 text-white shadow-inner' 
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                >
                    <Ruler size={18} />
                    {isRulerActive ? 'Close Ruler' : 'Measure'}
                </button>
            </div>
            <div className="flex-1 relative">
                <BlocklyEditor onCodeChange={setGeneratedCode} onEval={handleEvalCode} />
            </div>
        </div>

        {/* 3D VIEWPORT */}
        <div 
            className="w-1/2 relative bg-gray-900" 
            style={{ cursor: isColorPickerActive ? DROPPER_CURSOR_URL : 'auto' }}
        >
            {/* Top Info Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 text-white p-3 rounded backdrop-blur-sm text-left pointer-events-none">
                <p className="text-xs uppercase tracking-wider opacity-70">Robot State</p>
                <div className="font-mono text-sm">
                    X: {robotState.x.toFixed(2)}<br/>
                    Z: {robotState.z.toFixed(2)}<br/>
                    Speed: {robotState.speed}%
                </div>
            </div>

            {/* Active Challenge HUD */}
            {activeChallenge && (
                <div className="absolute top-4 right-4 z-10 w-64 bg-white/95 text-slate-900 p-4 rounded-xl shadow-xl backdrop-blur-sm text-right border-r-4 border-yellow-500" dir="rtl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">משימה פעילה</span>
                        <button onClick={() => setActiveChallenge(null)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{activeChallenge.title}</h3>
                    <p className="text-sm text-slate-600">{activeChallenge.description}</p>
                </div>
            )}

            {/* SENSOR DASHBOARD */}
            <SensorDashboard 
                distance={sensorReadings.distance}
                isTouching={sensorReadings.isTouching}
                gyroAngle={sensorReadings.gyro}
                detectedColor={sensorReadings.color}
                lightIntensity={sensorReadings.intensity}
                overrideColor={isColorPickerActive ? pickerHoverColor : null}
                onColorClick={toggleColorPicker} 
            />

            <Canvas shadows camera={{ position: [5, 8, 8], fov: 45 }}>
                <SimulationEnvironment />
                <Robot3D state={robotState} />
                
                {/* Tools */}
                {isRulerActive && <RulerTool key="ruler" />}
                {isColorPickerActive && (
                    <ColorPickerTool 
                        key="colorpicker" 
                        onColorHover={setPickerHoverColor}
                        onColorSelect={handleColorPicked}
                    />
                )}

                <OrbitControls 
                    makeDefault 
                    minDistance={3} 
                    maxDistance={20} 
                    enabled={!isRulerActive && !isColorPickerActive} 
                />
            </Canvas>
        </div>

        {/* NUMPAD OVERLAY */}
        <Numpad 
            isOpen={numpadConfig.isOpen}
            initialValue={numpadConfig.value}
            onClose={() => setNumpadConfig(prev => ({ ...prev, isOpen: false }))}
            onConfirm={numpadConfig.onConfirm}
        />

        {/* CHALLENGE SELECTION MODAL */}
        {showChallenges && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">משימות ואתגרים</h2>
                            <p className="text-gray-500">בחר אתגר כדי להתחיל ללמוד ולתרגל</p>
                        </div>
                        <button onClick={() => setShowChallenges(false)} className="p-2 hover:bg-gray-200 rounded-full">
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100">
                        {CHALLENGES.map((challenge) => (
                            <button 
                                key={challenge.id}
                                onClick={() => selectChallenge(challenge)}
                                className={`flex flex-col text-right p-5 rounded-xl border-2 transition-all hover:shadow-lg bg-white ${
                                    activeChallenge?.id === challenge.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                                }`}
                            >
                                <div className="flex justify-between items-start w-full mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                        challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {challenge.difficulty === 'Easy' ? 'קל' : challenge.difficulty === 'Medium' ? 'בינוני' : 'קשה'}
                                    </span>
                                    {activeChallenge?.id === challenge.id && <CheckCircle size={20} className="text-blue-500" />}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{challenge.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{challenge.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* SUCCESS MODAL */}
        {challengeSuccess && activeChallenge && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300" dir="rtl">
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm border-4 border-green-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">כל הכבוד!</h2>
                    <p className="text-gray-600 mb-6 text-lg">
                        השלמת בהצלחה את המשימה: <br/>
                        <span className="font-bold text-green-700">{activeChallenge.title}</span>
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => {
                                setChallengeSuccess(false);
                                setActiveChallenge(null);
                                setShowChallenges(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            המשימה הבאה
                        </button>
                         <button 
                            onClick={() => setChallengeSuccess(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            סגור
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;