
import { RobotState, Mission } from './types';

// Physical constants
export const WHEEL_CIRCUMFERENCE = 17.6; // Standard EV3 Wheel Circumference in cm

// Changed rotation to 0 so standard Math.cos(0) moves positive X (Right/East)
export const INITIAL_ROBOT_STATE: RobotState = {
  x: -200, // Shifted back by 200 units (20 3D units / 2 grid sections)
  y: 0,
  rotation: 0, 
  color: '#3b82f6', // blue-500
  sensorDistance: 255, // Max reading
  sensorTouch: false,
  sensorDetectedColor: 'Gray'
};

export const STAGE_WIDTH = 600; // Widen slightly for distance
export const STAGE_HEIGHT = 360;

// Scratch 3.0 Colors
const COLORS = {
  MOTION: '#4C97FF',
  LOOKS: '#9966FF',
  CONTROL: '#FFAB19',
  EVENTS: '#FFBF00',
  SENSING: '#5CB1D6',
  OPERATORS: '#59C059',
  VARIABLES: '#FF8C1A'
};

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Mission 1: Go the Distance",
    description: "Program the robot to move forward and stop exactly on the red finish line (Distance: 300).",
    targetX: 100, // Shifted from 300 to 100 to maintain 300 distance from start (-200)
    targetY: 0,
    tolerance: 30,
    finishLineRotation: 0
  },
  {
    id: 2,
    title: "Mission 2: Blocked Road",
    description: "A giant cube is blocking the road! Click on the cube to remove it, then drive to the finish line.",
    targetX: 100, // Same target as Mission 1 (Straight line)
    targetY: 0,   // Same target as Mission 1
    tolerance: 50, // Increased tolerance for easier success
    finishLineRotation: 0, // Facing same direction as Mission 1
    obstacles: [
       // A cube obstacle placed on the straight path (40x40 units)
       { id: 'cube1', x: -50, y: 0, width: 40, height: 40, rotation: 0, color: '#ef4444' }
    ]
  },
  {
    id: 3,
    title: "Mission 3: The Zig-Zag",
    description: "Navigate through the walls! The path is blocked. Turn right and left to find the gaps and reach the finish line.",
    targetX: 200,
    targetY: 0,
    tolerance: 40,
    finishLineRotation: 0,
    obstacles: [
       // Wall 1: Blocks the center/top. Robot must go DOWN (Negative Y) to pass.
       // Y=90, Height=200 -> Covers Y from -10 to 190.
       { id: 'wall1', x: -60, y: 90, width: 20, height: 200, rotation: 0, color: '#64748b' },
       
       // Wall 2: Blocks the center/bottom. Robot must go UP (Positive Y) to pass.
       // Y=-90, Height=200 -> Covers Y from -190 to 10.
       { id: 'wall2', x: 80, y: -90, width: 20, height: 200, rotation: 0, color: '#64748b' }
    ]
  },
  {
    id: 4,
    title: "Mission 4: The Slalom",
    description: "Precision driving required! Weave through the orange gates without crashing to reach the finish line.",
    targetX: 200,
    targetY: 0,
    tolerance: 40,
    finishLineRotation: 0,
    obstacles: [
       // Gate 1: Blocks the center path. Must go UP or DOWN around it.
       { id: 'gate1', x: -100, y: 0, width: 20, height: 100, rotation: 0, color: '#f59e0b' },
       
       // Gate 2: Blocks the top path. Must go DOWN.
       { id: 'gate2', x: 0, y: 100, width: 20, height: 140, rotation: 0, color: '#f59e0b' },
       
       // Gate 3: Blocks the bottom path. Must go UP.
       { id: 'gate3', x: 100, y: -100, width: 20, height: 140, rotation: 0, color: '#f59e0b' }
    ]
  }
];

// Simple custom block definitions in a format compatible with Blockly's JSON init
export const CUSTOM_BLOCKS = [
  {
    "type": "robot_start",
    "message0": "when 🏁 clicked",
    "nextStatement": null,
    "colour": COLORS.EVENTS,
    "tooltip": "Start the program",
    "helpUrl": ""
  },
  {
    "type": "robot_move_dir",
    "message0": "move %1 %2 %3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          ["FD", "FORWARD"],
          ["BK", "BACKWARD"]
        ]
      },
      {
        "type": "input_value", // Changed from field_scratch_number to input_value to allow blocks
        "name": "STEPS",
        "check": "Number"
      },
      {
        "type": "field_dropdown",
        "name": "UNIT",
        "options": [
          ["rotations", "ROTATIONS"],
          ["degrees", "DEGREES"],
          ["seconds", "SECONDS"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Move the robot forward or backward by specific unit",
    "helpUrl": ""
  },
  {
    "type": "robot_start_motor",
    "message0": "start motor %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          ["forward", "FORWARD"],
          ["backward", "BACKWARD"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Start moving the robot indefinitely",
    "helpUrl": ""
  },
  {
    "type": "robot_stop_motors",
    "message0": "stop robot",
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Stop all robot movement",
    "helpUrl": ""
  },
  // A helper block to act as a number input that supports our Numpad
  {
    "type": "robot_number",
    "message0": "%1",
    "args0": [
      {
        "type": "field_scratch_number",
        "name": "NUM",
        "value": 1
      }
    ],
    "output": "Number",
    "colour": "#FFFFFF", // White background to blend into the input slot like Scratch
    "colourSecondary": "#FFFFFF",
    "colourTertiary": "#FFFFFF",
    "tooltip": "Number input",
    "helpUrl": ""
  },
  {
    "type": "robot_move",
    "message0": "move %1 steps",
    "args0": [
      {
        "type": "field_scratch_number", // Used custom field
        "name": "STEPS",
        "value": 10
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Move the robot forward",
    "helpUrl": ""
  },
  {
    "type": "robot_turn_right",
    "message0": "turn right %1 degrees",
    "args0": [
      {
        "type": "field_scratch_number", // Used custom field
        "name": "DEGREES",
        "value": 15
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Turn robot right",
    "helpUrl": ""
  },
  {
    "type": "robot_turn_left",
    "message0": "turn left %1 degrees",
    "args0": [
      {
        "type": "field_scratch_number", // Used custom field
        "name": "DEGREES",
        "value": 15
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Turn robot left",
    "helpUrl": ""
  },
  {
    "type": "robot_set_speed",
    "message0": "set speed to %1 %%",
    "args0": [
      {
        "type": "field_scratch_number", // Used custom field
        "name": "SPEED",
        "value": 50,
        "min": 0,
        "max": 100
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.MOTION,
    "tooltip": "Set robot speed (0-100%)",
    "helpUrl": ""
  },
  {
    "type": "robot_wheel_circumference",
    "message0": "wheel circumference (cm)",
    "output": "Number",
    "colour": COLORS.MOTION,
    "tooltip": "Returns the wheel circumference in cm",
    "helpUrl": ""
  },
  {
    "type": "robot_set_color",
    "message0": "set color to %1",
    "args0": [
      {
        "type": "field_colour",
        "name": "COLOR",
        "colour": "#ff0000"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.LOOKS,
    "tooltip": "Change robot color",
    "helpUrl": ""
  },
  // Control Blocks
  {
    "type": "robot_wait",
    "message0": "wait %1 seconds",
    "args0": [
      {
        "type": "input_value",
        "name": "SECONDS",
        "check": "Number"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.CONTROL,
    "tooltip": "Wait for specified time",
    "helpUrl": ""
  },
  {
    "type": "robot_wait_until",
    "message0": "wait until %1",
    "args0": [
      {
        "type": "input_value",
        "name": "CONDITION",
        "check": "Boolean"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": COLORS.CONTROL,
    "tooltip": "Wait until condition is true",
    "helpUrl": ""
  },
  // Sensor Blocks
  {
    "type": "robot_get_distance",
    "message0": "distance to obstacle (cm)",
    "output": "Number",
    "colour": COLORS.SENSING,
    "tooltip": "Get distance from ultrasonic sensor",
    "helpUrl": ""
  },
  {
    "type": "robot_is_pressed",
    "message0": "touch sensor pressed?",
    "output": "Boolean",
    "colour": COLORS.SENSING,
    "tooltip": "Check if front touch sensor is pressed",
    "helpUrl": ""
  }
];

export const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
  <category name="Events" css-class="category-events">
    <block type="robot_start"></block>
  </category>
  
  <category name="Motion" css-class="category-motion">
    <block type="robot_move_dir">
        <value name="STEPS">
            <shadow type="robot_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
    </block>
    <block type="robot_start_motor"></block>
    <block type="robot_stop_motors"></block>
    <block type="robot_turn_right"></block>
    <block type="robot_turn_left"></block>
    <block type="robot_set_speed"></block>
    <block type="robot_wheel_circumference"></block>
  </category>
  
  <category name="Control" css-class="category-control">
    <block type="robot_wait">
        <value name="SECONDS">
            <shadow type="robot_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
    </block>
    <block type="robot_wait_until"></block>
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="robot_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
    </block>
    <block type="controls_if"></block>
    <block type="controls_whileUntil"></block>
  </category>

  <category name="Sensing" css-class="category-sensing">
    <block type="robot_get_distance"></block>
    <block type="robot_is_pressed"></block>
  </category>

  <category name="Operators" css-class="category-operators">
    <block type="robot_number">
        <field name="NUM">1</field>
    </block>
    <block type="math_arithmetic">
        <value name="A">
            <shadow type="robot_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
        <value name="B">
            <shadow type="robot_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
    </block>
    <block type="math_random_int">
      <value name="FROM">
        <shadow type="robot_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="robot_number">
          <field name="NUM">100</field>
        </shadow>
      </value>
    </block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_boolean"></block>
    <block type="logic_negate"></block>
  </category>
</xml>
`;
