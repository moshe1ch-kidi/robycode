
export interface RobotState {
  x: number;
  y: number;
  rotation: number; // degrees
  color: string;
  // Sensors
  sensorDistance: number; // cm
  sensorTouch: boolean;
  sensorDetectedColor: string; // 'Gray', 'Green', 'Red', etc.
}

export enum CommandType {
  MOVE = 'MOVE',
  ROTATE = 'ROTATE',
  SET_COLOR = 'SET_COLOR',
  WAIT = 'WAIT',
  WAIT_UNTIL = 'WAIT_UNTIL',
  RESET = 'RESET',
  SET_SPEED = 'SET_SPEED',
  START_MOTOR = 'START_MOTOR',
  STOP_MOTORS = 'STOP_MOTORS'
}

export interface Command {
  type: CommandType;
  value?: number | string;
  unit?: string; // 'ROTATIONS' | 'DEGREES' | 'SECONDS' | undefined (steps)
}

export interface SimulationConfig {
  stepDelay: number; // ms
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  color?: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  targetX?: number;
  targetY?: number;
  finishLineRotation?: number; // degrees
  tolerance: number; // How close needs to be to win
  obstacles?: Obstacle[];
}
