// Initialize Blockly Setup

// --- SCRATCH THEME DEFINITION ---
// We wrap this in a function to lazily access Blockly global
export const getScratchTheme = () => {
  const Blockly = (window as any).Blockly;
  if (!Blockly) return null;

  return Blockly.Theme.defineTheme('scratch', {
    'base': Blockly.Themes.Classic,
    'blockStyles': {
      'motion_blocks': {
        'colourPrimary': '#4C97FF',
        'colourSecondary': '#4280D7',
        'colourTertiary': '#3373CC'
      },
      'looks_blocks': {
        'colourPrimary': '#9966FF',
        'colourSecondary': '#855CD6',
        'colourTertiary': '#774DCB'
      },
      'events_blocks': {
        'colourPrimary': '#FFBF00',
        'colourSecondary': '#E6AC00',
        'colourTertiary': '#CC9900'
      },
      'control_blocks': {
        'colourPrimary': '#FFAB19',
        'colourSecondary': '#EC9C13',
        'colourTertiary': '#CF8B17'
      },
      'sensors_blocks': {
        'colourPrimary': '#00C7E5',
        'colourSecondary': '#00B8D4',
        'colourTertiary': '#00ACC1'
      },
      'logic_blocks': {
        'colourPrimary': '#59C059',
        'colourSecondary': '#46B946',
        'colourTertiary': '#389438'
      },
      'math_blocks': {
          'colourPrimary': '#59C059',
          'colourSecondary': '#46B946',
          'colourTertiary': '#389438'
        },
    },
    'categoryStyles': {
      'motion_category': {
        'colour': '#4C97FF'
      },
      'looks_category': {
        'colour': '#9966FF'
      },
      'events_category': {
        'colour': '#FFBF00'
      },
      'control_category': {
        'colour': '#FFAB19'
      },
      'sensors_category': {
        'colour': '#00C7E5'
      },
      'logic_category': {
          'colour': '#59C059'
      }
    },
    'componentStyles': {
      'workspaceBackgroundColour': '#F9F9F9',
      'toolboxBackgroundColour': '#FFFFFF',
      'toolboxForegroundColour': '#575E75',
      'flyoutBackgroundColour': '#F9F9F9',
      'flyoutOpacity': 1,
      'scrollbarColour': '#CECDCE',
      'insertionMarkerColour': '#000000',
      'insertionMarkerOpacity': 0.2,
      'cursorColour': '#000000',
    },
    'fontStyle': {
      'family': '"Rubik", "Helvetica Neue", Helvetica, sans-serif',
      'weight': 'bold',
      'size': 12,
    }
  });
};

export const initBlockly = () => {
  const Blockly = (window as any).Blockly;
  const javascript = (window as any).javascript;
  
  if (!Blockly || !javascript) {
    console.error("Blockly or Javascript generator not loaded");
    return;
  }
  
  const javascriptGenerator = javascript.javascriptGenerator;

  // --- CUSTOM NUMPAD FIELD ---
  // Define a custom class that extends FieldNumber
  class FieldNumpad extends Blockly.FieldNumber {
    constructor(value?: any, min?: any, max?: any, precision?: any, validator?: any) {
        super(value, min, max, precision, validator);
    }
    
    // Override the showEditor_ method to open our React Numpad
    showEditor_() {
        // We use the global window function exposed by App.tsx
        if (window.showBlocklyNumpad) {
            window.showBlocklyNumpad(this.getValue(), (newValue) => {
                this.setValue(newValue);
            });
        } else {
            // Fallback to default if React isn't ready
            super.showEditor_(); 
        }
    }
  }

  // Register or just use this class. 
  // We'll use it directly in block definitions below.

  // --- DEFINE BLOCKS ---

  // --- EVENTS (HATS) ---
  
  // 1. Green Flag Start
  Blockly.Blocks['event_program_start'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("When")
          .appendField(new Blockly.FieldImage(
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%234C97FF' stroke='%234C97FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'/%3E%3Cline x1='4' y1='22' x2='4' y2='15'/%3E%3C/svg%3E",
            20,
            20,
            "Flag"
          ))
          .appendField("clicked");
      this.setNextStatement(true, null);
      this.setStyle('events_blocks');
      this.setTooltip("Start the program");
    }
  };

  // 2. When Touching Obstacle
  Blockly.Blocks['event_when_obstacle'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("When obstacle detected");
          this.setNextStatement(true, null);
          this.setStyle('events_blocks');
          this.setTooltip("Trigger when robot hits an obstacle");
      }
  };

  // 3. When Color Detected
  Blockly.Blocks['event_when_color'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("When color")
              .appendField(new Blockly.FieldDropdown([
                  ["Black", "black"], 
                  ["White", "white"], 
                  ["Red", "red"]
                ]), "COLOR")
              .appendField("detected");
          this.setNextStatement(true, null);
          this.setStyle('events_blocks');
          this.setTooltip("Trigger when the color sensor sees the selected color");
      }
  };

  // --- MOTION ---

  // 1. Move Forward/Backward
  Blockly.Blocks['robot_move'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Drive")
          .appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"]]), "DIRECTION")
          .appendField("distance")
          // Use FieldNumpad instead of FieldNumber
          .appendField(new FieldNumpad(10), "DISTANCE")
          .appendField("cm");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks'); 
      this.setTooltip("Move the robot forward or backward");
    }
  };

  // 2. Turn
  Blockly.Blocks['robot_turn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Turn")
          .appendField(new Blockly.FieldDropdown([["Right","RIGHT"], ["Left","LEFT"]]), "DIRECTION")
          .appendField("angle")
          // Use FieldNumpad
          .appendField(new FieldNumpad(90), "ANGLE")
          .appendField("degrees");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks');
      this.setTooltip("Turn the robot");
    }
  };

  // 2.5 Set Speed
  Blockly.Blocks['robot_set_speed'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("Set speed to")
              .appendField(new FieldNumpad(100, 0, 100), "SPEED")
              .appendField("%");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setStyle('motion_blocks');
          this.setTooltip("Set the robot speed percentage (0-100)");
      }
  };

  // 3. LED Control
  Blockly.Blocks['robot_led'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Set LED")
          .appendField(new Blockly.FieldDropdown([["Left","LEFT"], ["Right","RIGHT"], ["Both","BOTH"]]), "SIDE")
          .appendField("color")
          .appendField(new Blockly.FieldColour("#ff0000"), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('looks_blocks');
      this.setTooltip("Change the robot LED color");
    }
  };

  // 3.5 Turn Off LED
  Blockly.Blocks['robot_led_off'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Turn Off LED")
          .appendField(new Blockly.FieldDropdown([["Left","LEFT"], ["Right","RIGHT"], ["Both","BOTH"]]), "SIDE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('looks_blocks');
      this.setTooltip("Turn off the robot LED");
    }
  };
  
   // 4. Wait
   Blockly.Blocks['robot_wait'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Wait")
          // Use FieldNumpad
          .appendField(new FieldNumpad(1), "SECONDS")
          .appendField("seconds");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('control_blocks');
      this.setTooltip("Pause the program");
    }
  };

  // Override Math Number to use Numpad
  Blockly.Blocks['math_number'] = {
      init: function() {
        this.setHelpUrl(Blockly.Msg.MATH_NUMBER_HELPURL);
        this.setColour(Blockly.Msg.MATH_HUE);
        this.appendDummyInput()
            .appendField(new FieldNumpad(0), 'NUM');
        this.setOutput(true, 'Number');
        this.setStyle('math_blocks'); 
        this.setTooltip(Blockly.Msg.MATH_NUMBER_TOOLTIP);
      }
  }

  // --- SENSOR BLOCKS ---

  // 5. Ultrasonic Sensor (Distance)
  Blockly.Blocks['sensor_ultrasonic'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Distance to obstacle (cm)");
      this.setOutput(true, "Number");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns distance to nearest object");
    }
  };

  // 6. Touch Sensor
  Blockly.Blocks['sensor_touch'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Touch sensor pressed?");
      this.setOutput(true, "Boolean");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns true if robot hits a wall");
    }
  };

  // 7. Gyro Sensor
  Blockly.Blocks['sensor_gyro'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Gyro Angle");
      this.setOutput(true, "Number");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns current robot orientation");
    }
  };

  // 8. Color Sensor
  Blockly.Blocks['sensor_color'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Detected Color");
      this.setOutput(true, "String");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns the color seen by the robot (white/black)");
    }
  };


  // --- DEFINE GENERATORS ---

  // Event Generators
  javascriptGenerator.forBlock['event_program_start'] = function(block: any) {
      return '// Program Start\n';
  };

  javascriptGenerator.forBlock['event_when_obstacle'] = function(block: any) {
      return '// Event: When Obstacle\n';
  };
  
  javascriptGenerator.forBlock['event_when_color'] = function(block: any) {
      const color = block.getFieldValue('COLOR');
      return `// Event: When Color ${color}\n`;
  };


  javascriptGenerator.forBlock['robot_move'] = function(block: any) {
    const direction = block.getFieldValue('DIRECTION');
    const distance = block.getFieldValue('DISTANCE');
    // Ensure Forward corresponds to +Z (towards sensor) and Backward to -Z
    const distVal = direction === 'BACKWARD' ? -distance : distance;
    return `await robot.move(${distVal});\n`;
  };

  javascriptGenerator.forBlock['robot_turn'] = function(block: any) {
    const direction = block.getFieldValue('DIRECTION');
    const angle = block.getFieldValue('ANGLE');
    // Left turn = Positive Angle (CCW), Right turn = Negative Angle (CW)
    const angVal = direction === 'LEFT' ? angle : -angle;
    return `await robot.turn(${angVal});\n`;
  };

  javascriptGenerator.forBlock['robot_set_speed'] = function(block: any) {
      const speed = block.getFieldValue('SPEED');
      return `await robot.setSpeed(${speed});\n`;
  };

  javascriptGenerator.forBlock['robot_led'] = function(block: any) {
    const side = block.getFieldValue('SIDE');
    const color = block.getFieldValue('COLOR');
    return `robot.setLed('${side.toLowerCase()}', '${color}');\n`;
  };

  javascriptGenerator.forBlock['robot_led_off'] = function(block: any) {
      const side = block.getFieldValue('SIDE');
      // Setting color to black turns it off in Robot3D.tsx
      return `robot.setLed('${side.toLowerCase()}', 'black');\n`;
  };
  
  javascriptGenerator.forBlock['robot_wait'] = function(block: any) {
    const seconds = block.getFieldValue('SECONDS');
    return `await robot.wait(${seconds * 1000});\n`;
  };

  // Override standard Math Number generator just in case
  javascriptGenerator.forBlock['math_number'] = function(block: any) {
      const code = parseFloat(block.getFieldValue('NUM'));
      const order = code >= 0 ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_UNARY_NEGATION;
      return [code, order];
  }

  // Sensor Generators
  javascriptGenerator.forBlock['sensor_ultrasonic'] = function(block: any) {
    return ['await robot.getDistance()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock['sensor_touch'] = function(block: any) {
    return ['await robot.getTouch()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock['sensor_gyro'] = function(block: any) {
    return ['await robot.getGyro()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };
  
  javascriptGenerator.forBlock['sensor_color'] = function(block: any) {
    return ['await robot.getColor()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };
};

// Config structure with Scratch Styles
export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Events",
      categorystyle: "events_category", // Yellow
      cssConfig: { "container": "category-events" },
      contents: [
          { kind: "block", type: "event_program_start" },
          { kind: "block", type: "event_when_obstacle" },
          { kind: "block", type: "event_when_color" }
      ]
    },
    {
      kind: "category",
      name: "Motion",
      categorystyle: "motion_category", // Links to theme color
      cssConfig: { "container": "category-motion" }, // Link to CSS class for Icon
      contents: [
        { kind: "block", type: "robot_move" },
        { kind: "block", type: "robot_turn" },
        { kind: "block", type: "robot_set_speed" },
      ]
    },
    {
      kind: "category",
      name: "Looks",
      categorystyle: "looks_category", // Links to theme color
      cssConfig: { "container": "category-looks" }, // Link to CSS class for Icon
      contents: [
        { kind: "block", type: "robot_led" },
        { kind: "block", type: "robot_led_off" },
      ]
    },
    {
      kind: "category",
      name: "Sensors",
      categorystyle: "sensors_category",
      cssConfig: { "container": "category-sensors" },
      contents: [
        { kind: "block", type: "sensor_ultrasonic" },
        { kind: "block", type: "sensor_touch" },
        { kind: "block", type: "sensor_gyro" },
        { kind: "block", type: "sensor_color" },
      ]
    },
    {
      kind: "category",
      name: "Control",
      categorystyle: "control_category", // Links to theme color
      cssConfig: { "container": "category-control" }, // Link to CSS class for Icon
      contents: [
        { kind: "block", type: "robot_wait" },
        // Repeat Ext uses math_number shadow, which we overrode
        { kind: "block", type: "controls_repeat_ext", inputs: { TIMES: { shadow: { type: "math_number", fields: { NUM: 5 } } } } },
        { kind: "block", type: "controls_if" },
      ]
    },
    {
        kind: "category",
        name: "Logic",
        categorystyle: "logic_category", // Links to theme color
        cssConfig: { "container": "category-logic" }, // Link to CSS class for Icon
        contents: [
            { kind: "block", type: "logic_compare" },
            { kind: "block", type: "logic_operation" },
            { kind: "block", type: "logic_boolean" },
            { kind: "block", type: "math_number" }, // Useful for comparisons
        ]
    }
  ]
};