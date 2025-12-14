
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, Code, Box, Info, CheckCircle, XCircle, Eye, Hand, Palette, MapPin, Compass, Ruler, Map, Download, Upload, Square } from 'lucide-react';
import BlocklyEditor from './components/BlocklyEditor';
import Stage from './components/Stage';
import Numpad from './components/Numpad';
import { INITIAL_ROBOT_STATE, STAGE_WIDTH, STAGE_HEIGHT, MISSIONS, WHEEL_CIRCUMFERENCE } from './constants';
import { RobotState, Command, CommandType, Mission, Obstacle } from './types';
import { generateCommands } from './services/blocklyService';
import * as Blockly from 'blockly';

// Handle ESM import differences to ensure we get the actual Blockly object with Xml properties
const BlocklyJS = (Blockly as any).default || Blockly;

interface NumpadState {
  visible: boolean;
  value: string | number;
  position: { x: number; y: number };
  callback: ((val: number) => void) | null;
}

const App: React.FC = () => {
  const [robotState, setRobotState] = useState<RobotState>(INITIAL_ROBOT_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [activeObstacles, setActiveObstacles] = useState<Obstacle[]>([]);
  const [missionResult, setMissionResult] = useState<'success' | 'failure' | null>(null);
  const [failureReason, setFailureReason] = useState<string>(''); // Added state for failure reason
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showMissionSelector, setShowMissionSelector] = useState(false);
  
  // Numpad State
  const [numpad, setNumpad] = useState<NumpadState>({
    visible: false,
    value: 0,
    position: { x: 0, y: 0 },
    callback: null
  });
  
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const stopRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMission = MISSIONS[currentMissionIndex];

  // Initialize obstacles when mission changes
  useEffect(() => {
    if (currentMission && currentMission.obstacles) {
      setActiveObstacles([...currentMission.obstacles]);
    } else {
      setActiveObstacles([]);
    }
  }, [currentMissionIndex]);

  // Listener for custom event dispatched from FieldScratchNumber
  useEffect(() => {
    const handleOpenNumpad = (e: any) => {
      const { initialValue, position, callback } = e.detail;
      setNumpad({
        visible: true,
        value: initialValue,
        position,
        callback
      });
    };

    window.addEventListener('open-numpad', handleOpenNumpad);
    return () => window.removeEventListener('open-numpad', handleOpenNumpad);
  }, []);

  const handleNumpadSubmit = (newValue: number) => {
    if (numpad.callback) {
      numpad.callback(newValue);
    }
  };

  const handleWorkspaceChange = useCallback((workspace: Blockly.WorkspaceSvg) => {
    workspaceRef.current = workspace;
  }, []);

  const resetSimulation = () => {
    stopRef.current = true;
    setIsRunning(false);
    setRobotState(INITIAL_ROBOT_STATE);
    setMissionResult(null);
    setFailureReason('');
    // Restore obstacles
    if (currentMission && currentMission.obstacles) {
        setActiveObstacles([...currentMission.obstacles]);
    } else {
        setActiveObstacles([]);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    setIsRunning(false);
  };

  const handleSelectMission = (index: number) => {
      setCurrentMissionIndex(index);
      setShowMissionSelector(false);
      // Allow state to settle then reset
      setTimeout(() => resetSimulation(), 0);
  };

  const handleNextMission = () => {
    if (currentMissionIndex < MISSIONS.length - 1) {
       handleSelectMission(currentMissionIndex + 1);
    } else {
       resetSimulation();
    }
  };

  const handleObstacleClick = (id: string) => {
    // Remove the obstacle with the matching ID
    setActiveObstacles(prev => prev.filter(obs => obs.id !== id));
  };

  // --- Save / Load Project Logic ---
  const handleSaveProject = () => {
    if (!workspaceRef.current) return;
    try {
        // Resolve XML helper - handle different import structures
        const Xml = BlocklyJS.Xml || (Blockly as any).Xml;
        
        if (!Xml) throw new Error("Blockly XML module not found");

        const xmlDom = Xml.workspaceToDom(workspaceRef.current);
        const xmlText = Xml.domToText(xmlDom);
        
        const blob = new Blob([xmlText], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `robocode_mission_${currentMissionIndex + 1}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to save project:", e);
        alert("Could not save project.");
    }
  };

  const handleLoadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !workspaceRef.current) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const xmlContent = e.target?.result as string;
          if (xmlContent) {
              try {
                  const workspace = workspaceRef.current!;
                  workspace.clear(); // Clear current blocks
                  
                  const Xml = BlocklyJS.Xml || (Blockly as any).Xml;
                  
                  let dom;
                  
                  // Strategy 1: Try standard Xml.textToDom
                  if (Xml && typeof Xml.textToDom === 'function') {
                      dom = Xml.textToDom(xmlContent);
                  } 
                  // Strategy 2: Try utils.xml.textToDom (common in ESM builds)
                  else if (BlocklyJS.utils && BlocklyJS.utils.xml && typeof BlocklyJS.utils.xml.textToDom === 'function') {
                      dom = BlocklyJS.utils.xml.textToDom(xmlContent);
                  }
                  // Strategy 3: Native DOMParser fallback
                  else {
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(xmlContent, "text/xml");
                      dom = doc.documentElement;
                  }

                  if (Xml && typeof Xml.domToWorkspace === 'function') {
                      Xml.domToWorkspace(dom, workspace);
                  } else {
                      throw new Error("domToWorkspace function not found in Blockly.Xml");
                  }
                  
              } catch (error) {
                  console.error("Error parsing XML:", error);
                  alert("Invalid project file.");
              }
          }
      };
      reader.readAsText(file);
      // Reset input so the same file can be selected again
      event.target.value = '';
  };


  const checkMissionSuccess = (finalState: RobotState) => {
    if (!currentMission) return;

    let success = false;
    let reason = "";

    // Check if crashed first
    if (finalState.sensorTouch) {
        setMissionResult('failure');
        setFailureReason("The robot crashed into an obstacle or wall!");
        return;
    }
    
    // Check Distance to Target (X and Y)
    // Modified: Logic now uses a Rectangular Box check instead of a simple Radius circle.
    // This allows the robot to be "off-center" (Y-axis) but still on the finish line strip.
    if (currentMission.targetX !== undefined) {
      const tx = currentMission.targetX;
      const ty = currentMission.targetY || 0;
      
      const dx = Math.abs(finalState.x - tx);
      const dy = Math.abs(finalState.y - ty);
      
      // Visual road width is roughly 400 (from -200 to 200). 
      // We allow a generous Y deviation (e.g. 180) to consider it "on the road/line".
      const allowedYDeviation = 180; 

      if (dx <= currentMission.tolerance && dy <= allowedYDeviation) {
        success = true;
      } else {
          if (dx > currentMission.tolerance) {
              // Missed by length
              const dirText = finalState.x < tx ? "Move forward more." : "You went too far.";
              reason = `You missed the target zone by ${Math.round(dx - currentMission.tolerance)} cm.\n${dirText}`;
          } else {
              // Missed by width (fell off road)
              reason = `The robot is too far to the side (off the road).`;
          }
      }
    }

    setMissionResult(success ? 'success' : 'failure');
    if (!success) setFailureReason(reason);
  };

  // --- Sensor Logic ---
  const calculateSensors = (state: RobotState, mission?: Mission): RobotState => {
    const newState = { ...state };
    const halfW = STAGE_WIDTH / 2;
    const halfH = STAGE_HEIGHT / 2;

    // 1. Color Sensor
    // Default Floor
    newState.sensorDetectedColor = 'Gray';
    
    // Check Start Line (x approx -20, width 10)
    if (Math.abs(state.x - (-20)) < 15 && Math.abs(state.y) < 200) {
      newState.sensorDetectedColor = 'Green';
    }
    // Check Finish Line (from Mission)
    else if (mission && mission.targetX !== undefined) {
       const finishX = mission.targetX;
       const finishY = mission.targetY || 0;
       
       // UPDATED: Check for Finish Line Color (Rectangular strip logic to match success check)
       const dx = Math.abs(state.x - finishX);
       const dy = Math.abs(state.y - finishY);
       
       // Visual tolerance for color sensing (width of the red strip in Stage.tsx)
       const visualWidth = (mission.tolerance || 30) + 10; 
       
       if (dx < visualWidth && dy < 190) { 
         newState.sensorDetectedColor = 'Red';
       }
    }

    // 2. Touch Sensor (Boundaries & Obstacles)
    // Robot radius approx 15 units
    const margin = 20; 
    let hitSomething = state.x <= -halfW - 200 + margin || 
                    state.x >= halfW + 200 - margin ||
                    state.y <= -halfH + margin || 
                    state.y >= halfH - margin;
    
    // Check active obstacles collision
    // Simplified collision: Check if robot center is within obstacle box + margin
    if (!hitSomething && activeObstacles.length > 0) {
        for (const obs of activeObstacles) {
            // Simplified AABB check (ignoring rotation for simplicity of touch, mostly accurate for orthogonal walls)
            // Expand bounds by robot radius (approx 15)
            const obsLeft = obs.x - obs.width / 2 - 15;
            const obsRight = obs.x + obs.width / 2 + 15;
            const obsTop = obs.y + obs.height / 2 + 15;
            const obsBottom = obs.y - obs.height / 2 - 15;

            if (state.x > obsLeft && state.x < obsRight && state.y > obsBottom && state.y < obsTop) {
                hitSomething = true;
                break;
            }
        }
    }

    newState.sensorTouch = hitSomething;

    // 3. Ultrasonic (Distance to walls based on rotation)
    // Raycasting to bounding box
    const rad = (state.rotation * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    let dist = 255; // Max distance
    
    // Bounds
    const minX = -halfW - 200;
    const maxX = halfW + 200;
    const minY = -halfH;
    const maxY = halfH;

    // Calculate distance to X planes
    let tX = Infinity;
    if (dx > 0) tX = (maxX - state.x) / dx;
    else if (dx < 0) tX = (minX - state.x) / dx;

    // Calculate distance to Y planes
    let tY = Infinity;
    if (dy > 0) tY = (maxY - state.y) / dy;
    else if (dy < 0) tY = (minY - state.y) / dy;

    // The real distance is the closest intersection
    let wallDist = Math.min(tX, tY);
    
    // Check Obstacles for Distance (Simplified: check center point of obstacle)
    // For a "Senior" implementation, we'd do proper ray-box intersection, but here we estimate
    if (activeObstacles.length > 0) {
        // Very basic check against obstacle centers to see if they are "in front"
        for (const obs of activeObstacles) {
            const vecToObsX = obs.x - state.x;
            const vecToObsY = obs.y - state.y;
            const distToObsCenter = Math.sqrt(vecToObsX*vecToObsX + vecToObsY*vecToObsY);
            
            // Normalize
            if (distToObsCenter > 0) {
                const dot = (vecToObsX * dx + vecToObsY * dy) / distToObsCenter;
                // If obstacle is largely in front (cone) and closer than wall
                if (dot > 0.9 && (distToObsCenter - 20) < wallDist) {
                    wallDist = Math.max(0, distToObsCenter - 20); // -20 for roughly surface
                }
            }
        }
    }
    
    // Clamp to sensor limit (e.g. 250cm)
    newState.sensorDistance = Math.min(250, Math.max(0, Math.round(wallDist)));

    return newState;
  };

  const executeCommands = async (commands: Command[], isManualRun = false) => {
    // If it's a manual run (click on block), we interrupt any existing run.
    // If it's a full run, we just start.
    setIsRunning(true);
    setMissionResult(null);
    stopRef.current = false;
    
    // If NOT manual run (Full Run button), reset to start.
    // If manual run (Block Click), continue from current position!
    let currentState: RobotState;

    if (!isManualRun) {
        setRobotState(calculateSensors(INITIAL_ROBOT_STATE, currentMission));
        await new Promise(r => setTimeout(r, 500)); // Short pause
        currentState = calculateSensors(INITIAL_ROBOT_STATE, currentMission);
    } else {
        // Use current state
        currentState = calculateSensors(robotState, currentMission);
    }
    
    // Default Speed % (0-100)
    let currentSpeed = 50; 
    let motorDirection = 0; // 0 = stopped, 1 = forward, -1 = backward
    
    for (const cmd of commands) {
      if (stopRef.current) break;

      if (cmd.type === CommandType.SET_SPEED) {
        currentSpeed = Number(cmd.value);
        // Small delay to visualize processing
        await new Promise(resolve => setTimeout(resolve, 20));
        continue;
      }

      if (cmd.type === CommandType.START_MOTOR) {
          motorDirection = cmd.value === 'FORWARD' ? 1 : -1;
          continue; // Immediate effect, proceed to next block
      }

      if (cmd.type === CommandType.STOP_MOTORS) {
          motorDirection = 0;
          continue;
      }
      
      const speedFactor = Math.max(1, Math.min(100, currentSpeed));
      const tickRate = 20; // ms

      // Helper function to process physics one step
      const processPhysicsStep = (dirMult: number): boolean => {
         const stepSize = 0.5 + (speedFactor / 100) * 15;
         const step = stepSize; // Simplified
         const actualStep = dirMult > 0 ? step : -step;
         
         const rad = (currentState.rotation * Math.PI) / 180;
         const nextX = currentState.x + Math.cos(rad) * actualStep;
         const nextY = currentState.y + Math.sin(rad) * actualStep;

         const predictedState = { ...currentState, x: nextX, y: nextY };
         const sensorCheck = calculateSensors(predictedState, currentMission);

         if (sensorCheck.sensorTouch) {
             currentState = sensorCheck;
             setRobotState({ ...currentState });
             return true; // Collision
         }

         currentState.x = nextX;
         currentState.y = nextY;
         
         const halfW = STAGE_WIDTH / 2 + 200;
         const halfH = STAGE_HEIGHT / 2;
         currentState.x = Math.max(-halfW, Math.min(halfW, currentState.x));
         currentState.y = Math.max(-halfH, Math.min(halfH, currentState.y));

         currentState = calculateSensors(currentState, currentMission);
         setRobotState({ ...currentState });
         return false;
      };

      if (cmd.type === CommandType.MOVE) {
        // Note: Standard MOVE blocks technically block other code, so they override infinite motor state temporarily
        // or effectively add to it. For simplicity, we treat them as standalone movements.
        let totalSteps = Math.abs(Number(cmd.value));
        const isNegative = Number(cmd.value) < 0;

        // --- Unit Conversions ---
        if (cmd.unit === 'ROTATIONS') {
            totalSteps = totalSteps * WHEEL_CIRCUMFERENCE;
        } else if (cmd.unit === 'DEGREES') {
            totalSteps = (totalSteps / 360) * WHEEL_CIRCUMFERENCE;
        } else if (cmd.unit === 'SECONDS') {
            const stepsPerTick = 0.5 + (speedFactor / 100) * 15;
            const stepsPerSecond = stepsPerTick * 50;
            totalSteps = totalSteps * stepsPerSecond;
        }

        let remaining = totalSteps;
        const stepSize = 0.5 + (speedFactor / 100) * 15;

        while (remaining > 0) {
            if (stopRef.current) break;
            const step = Math.min(remaining, stepSize);
            const collision = processPhysicsStep(isNegative ? -1 : 1);
            if (collision) break;
            remaining -= step;
            await new Promise(r => setTimeout(r, tickRate));
        }
      } 
      else if (cmd.type === CommandType.ROTATE) {
         const totalDegrees = Number(cmd.value);
         let remaining = Math.abs(totalDegrees);
         const stepSize = 1.0 + (speedFactor / 100) * 10;

         while (remaining > 0) {
             if (stopRef.current) break;
             
             const step = Math.min(remaining, stepSize);
             const direction = totalDegrees > 0 ? 1 : -1;
             
             currentState.rotation -= (step * direction);
             currentState = calculateSensors(currentState, currentMission);
             setRobotState({ ...currentState });
             remaining -= step;
             await new Promise(r => setTimeout(r, tickRate));
         }
      }
      else if (cmd.type === CommandType.SET_COLOR) {
          currentState.color = String(cmd.value);
          setRobotState({ ...currentState });
          await new Promise(r => setTimeout(r, 200));
      }
      else if (cmd.type === CommandType.WAIT) {
          const seconds = Number(cmd.value);
          const endTime = Date.now() + (seconds * 1000);
          
          while (Date.now() < endTime) {
              if (stopRef.current) break;
              
              // If motors are on, we move!
              if (motorDirection !== 0) {
                  const collision = processPhysicsStep(motorDirection);
                  if (collision) break; // If we crash during wait, we stop waiting? Or stop moving? Usually stop.
              } else {
                 // Even if stopped, update sensors (e.g. if obstacles move in future)
                 currentState = calculateSensors(currentState, currentMission);
                 setRobotState({...currentState}); 
              }
              
              await new Promise(r => setTimeout(r, tickRate));
          }
      }
      else if (cmd.type === CommandType.WAIT_UNTIL) {
          const conditionType = cmd.value;
          const startTime = Date.now();
          
          while (true) {
              if (stopRef.current) break;
              
              // If motors are on, we move!
              if (motorDirection !== 0) {
                   const collision = processPhysicsStep(motorDirection);
                   if (collision) {
                       // If we crash, we stop immediately, likely satisfying touch condition if that's what we waited for
                       // but we must check condition below
                   }
              } else {
                 currentState = calculateSensors(currentState, currentMission);
                 setRobotState({...currentState}); 
              }

              if (conditionType === 'TOUCH' && currentState.sensorTouch) {
                  break;
              }
              // Safety break after 60 seconds
              if (Date.now() - startTime > 60000) break;

              await new Promise(r => setTimeout(r, tickRate));
          }
      }
      else {
          await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsRunning(false);
    
    if (!stopRef.current && !isManualRun) {
        checkMissionSuccess(currentState);
    }
  };

  const handleRun = () => {
    if (!workspaceRef.current) return;
    const commands = generateCommands(workspaceRef.current);
    if (commands.length > 0) {
      executeCommands(commands);
    }
  };

  const handleBlockClickRun = (commands: Command[]) => {
      // If we are already running, stop the current execution and start the new one
      stopRef.current = true;
      
      // Wait a tiny bit for the loop to exit and then start new commands
      setTimeout(() => {
          executeCommands(commands, true); // true = manual run (don't reset position)
      }, 50);
  };

  // Helper for Sensor Colors
  const getSensorColorHex = (colorName: string) => {
    if (colorName === 'Red') return '#ef4444';
    if (colorName === 'Green') return '#22c55e';
    if (colorName === 'Blue') return '#3b82f6';
    return '#64748b'; // Gray/Default
  };

  // Helper for rotation display
  const displayRotation = Math.round(((robotState.rotation % 360) + 360) % 360);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileLoad} 
        accept=".xml" 
        className="hidden" 
      />

      {/* Numpad Portal */}
      {numpad.visible && (
        <Numpad 
          initialValue={numpad.value}
          position={numpad.position}
          onClose={() => setNumpad(prev => ({ ...prev, visible: false }))}
          onSubmit={handleNumpadSubmit}
        />
      )}

      {/* Mission Selector Modal */}
      {showMissionSelector && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Select Mission</h2>
                        <p className="text-slate-500 text-sm">Choose a challenge to program</p>
                    </div>
                    <button 
                       onClick={() => setShowMissionSelector(false)}
                       className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                       <XCircle className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50">
                   {MISSIONS.map((mission, idx) => (
                       <button
                          key={mission.id}
                          onClick={() => handleSelectMission(idx)}
                          className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.02] shadow-sm ${
                              currentMissionIndex === idx 
                                ? 'border-indigo-500 bg-white ring-2 ring-indigo-100' 
                                : 'border-slate-200 bg-white hover:border-indigo-300'
                          }`}
                       >
                           <div className="flex justify-between items-start mb-2">
                               <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                                   currentMissionIndex === idx ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                               }`}>
                                   Level {mission.id}
                               </span>
                               {currentMissionIndex === idx && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                           </div>
                           <h3 className="font-bold text-slate-800 mb-1">{mission.title}</h3>
                           <p className="text-sm text-slate-500 line-clamp-2">{mission.description}</p>
                       </button>
                   ))}
                </div>
             </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white p-3 shadow-md flex items-center justify-between shrink-0 h-16">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">RoboCode</h1>
            
            {/* Mission Selector Toggle */}
            <button 
               onClick={() => setShowMissionSelector(true)}
               className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
               <Map className="w-4 h-4 text-indigo-400" />
               <span className="text-sm font-medium">Levels</span>
            </button>
          </div>
        </div>
        
        {/* Current Active Mission Pill */}
        {currentMission && (
          <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700/50">
             <span className="text-yellow-400 font-bold text-sm">Active:</span>
             <span className="text-sm font-medium text-slate-300 truncate max-w-[200px]">{currentMission.title}</span>
          </div>
        )}

        {/* Save/Load Controls */}
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSaveProject}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 border border-slate-700 rounded-lg transition-all text-xs font-bold uppercase tracking-wide"
                title="Save Project"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
            </button>
            <button 
                onClick={handleLoadClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 border border-slate-700 rounded-lg transition-all text-xs font-bold uppercase tracking-wide"
                title="Load Project"
            >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Blockly Editor */}
        <div className="w-7/12 relative border-r border-gray-200">
           <BlocklyEditor onWorkspaceChange={handleWorkspaceChange} onRunBlock={handleBlockClickRun} />
        </div>

        {/* Right: Stage & Controls */}
        <div className="w-5/12 flex flex-col bg-gray-100 border-l border-gray-200 relative">
          
          {/* Mission Instructions Panel */}
          <div className="p-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
             <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                   <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Objective</h3>
                   <p className="text-gray-600 text-sm leading-relaxed">
                     {currentMission?.description}
                   </p>
                </div>
             </div>
          </div>

          {/* Control Bar (Moved Above Stage) */}
          <div className="p-3 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 flex items-center justify-between">
            <div className="flex gap-2">
               <button 
                 onClick={handleRun}
                 disabled={isRunning}
                 className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-base shadow-md transition-all transform active:scale-95 ${
                   isRunning 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200 shadow-none' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 hover:shadow-green-300'
                 }`}
               >
                 <Play className="w-5 h-5 fill-current" />
                 <span>{isRunning ? 'Running...' : 'Run'}</span>
               </button>

               <button 
                 onClick={handleStop}
                 disabled={!isRunning}
                 className={`w-12 flex items-center justify-center rounded-lg font-bold text-base shadow-md transition-all transform active:scale-95 ${
                    !isRunning
                    ? 'bg-gray-100 text-gray-300 border-2 border-gray-200 shadow-none'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200 hover:shadow-red-300'
                 }`}
                 title="Stop"
               >
                 <Square className="w-5 h-5 fill-current" />
               </button>

               <button 
                 onClick={resetSimulation}
                 disabled={isRunning}
                 className="w-12 flex items-center justify-center bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition-all active:scale-95"
                 title="Reset"
               >
                 <RotateCcw className="w-5 h-5" />
               </button>
            </div>
            
            {/* Tools Area */}
            <div className="ml-3 pl-3 border-l border-gray-200 flex gap-2">
                 <button 
                    onClick={() => setIsMeasuring(!isMeasuring)}
                    className={`p-2 rounded-lg border-2 transition-all ${isMeasuring ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    title="Measurement Tool"
                 >
                    <Ruler className="w-5 h-5" />
                 </button>
            </div>
          </div>

          {/* 3D Stage Area */}
          <div className="flex-1 relative bg-gray-200 overflow-hidden">
             <Stage 
                robotState={robotState} 
                currentMission={currentMission} 
                activeObstacles={activeObstacles}
                onObstacleClick={handleObstacleClick}
                isMeasuring={isMeasuring}
             />
             
             {/* Result Overlay */}
             {missionResult && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center transform scale-100">
                      {missionResult === 'success' ? (
                        <>
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                          <p className="text-gray-600 mb-6">You reached the target zone.</p>
                          <button onClick={handleNextMission} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all">
                             {currentMissionIndex < MISSIONS.length - 1 ? "Next Mission" : "Play Again"}
                          </button>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Try Again</h2>
                          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{failureReason || "The robot didn't stop in the target zone."}</p>
                          <button onClick={() => setMissionResult(null)} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg transition-all">
                             Adjust Code
                          </button>
                        </>
                      )}
                  </div>
               </div>
             )}
          </div>

          {/* Sensor Dashboard (Moved Below Stage) */}
          <div className="bg-slate-900 text-white p-3 shrink-0 border-t-4 border-slate-700">
             <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest">SENSORS & TELEMETRY</span>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 {/* Left Column: Sensors */}
                 <div className="space-y-2">
                     {/* Color */}
                     <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span>Color</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSensorColorHex(robotState.sensorDetectedColor) }}></div>
                            <span className="text-xs font-mono font-bold">{robotState.sensorDetectedColor}</span>
                        </div>
                     </div>

                     {/* Touch */}
                     <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            <Hand className="w-4 h-4 text-amber-400" />
                            <span>Touch</span>
                        </div>
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${robotState.sensorTouch ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                           {robotState.sensorTouch ? "TRUE" : "FALSE"}
                        </div>
                     </div>
                     
                     {/* Distance */}
                     <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            <Eye className="w-4 h-4 text-cyan-400" />
                            <span>Distance</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                           {robotState.sensorDistance} cm
                        </span>
                     </div>
                 </div>

                 {/* Right Column: Position */}
                 <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-white/10 rounded p-2 text-center border border-white/5">
                            <div className="text-[9px] text-gray-400 mb-0.5">X POS</div>
                            <div className="font-mono text-sm font-bold text-indigo-300">{Math.round(robotState.x)}</div>
                         </div>
                         <div className="bg-white/10 rounded p-2 text-center border border-white/5">
                            <div className="text-[9px] text-gray-400 mb-0.5">Y POS</div>
                            <div className="font-mono text-sm font-bold text-indigo-300">{Math.round(robotState.y)}</div>
                         </div>
                    </div>
                    
                    <div className="bg-white/10 rounded p-2 flex items-center justify-between border border-white/5 h-[42px]">
                       <div className="flex items-center gap-2">
                         <Compass className="w-4 h-4 text-gray-400" />
                         <span className="text-[10px] text-gray-400">HEADING</span>
                       </div>
                       <div className="font-mono text-sm font-bold text-indigo-300">{displayRotation}°</div>
                    </div>
                 </div>
             </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default App;
