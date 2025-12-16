import React from 'react';

export interface RobotState {
  x: number;
  y: number; // Vertical axis in 3D usually, but we operate on X/Z plane mostly
  z: number;
  rotation: number; // in degrees
  speed: number; // 0 to 100 percentage
  ledLeftColor: string;
  ledRightColor: string;
  isMoving: boolean;
}

export type RobotCommand = 
  | { type: 'MOVE'; distance: number }
  | { type: 'TURN'; angle: number }
  | { type: 'SET_LED'; side: 'left' | 'right' | 'both'; color: string }
  | { type: 'WAIT'; duration: number };

export interface SimulationContextType {
  runCode: (code: string) => void;
  resetSimulation: () => void;
  robotState: RobotState;
  setRobotState: React.Dispatch<React.SetStateAction<RobotState>>;
  isRunning: boolean;
}

// Fix for missing intrinsic elements types in R3F
// Augment global JSX namespace (legacy)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  interface Window {
    // Function exposed by React to open the Numpad
    showBlocklyNumpad: (
      initialValue: string | number, 
      onConfirm: (newValue: number) => void
    ) => void;

    // Function exposed by React to activate the 3D Color Picker
    showBlocklyColorPicker: (
      onPick: (newColor: string) => void
    ) => void;
  }
}

// Augment React.JSX namespace (React 18+)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}