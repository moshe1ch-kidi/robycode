
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
  class FieldNumpad extends Blockly.FieldNumber {
    constructor(value?: any, min?: any, max?: any, precision?: any, validator?: any) {
        super(value, min, max, precision, validator);
    }
    
    showEditor_() {
        if (window.showBlocklyNumpad) {
            window.showBlocklyNumpad(this.getValue(), (newValue) => {
                this.setValue(newValue);
            });
        } else {
            super.showEditor_(); 
        }
    }
  }

  // --- CUSTOM COLOR DROPPER FIELD ---
  // Extends the standard Color field but opens our 3D picker
  class FieldColorDropper extends Blockly.FieldColour {
    constructor(value?: any, validator?: any) {
        super(value, validator);
    }

    showEditor_() {
        if (window.showBlocklyColorPicker) {
            // Call the React function to enable the 3D tool
            window.showBlocklyColorPicker((newColor: string) => {
                this.setValue(newColor);
            });
        } else {
            // Fallback to default palette if React isn't connected
            super.showEditor_();
        }
    }
  }

  // --- DEFINE BLOCKS ---

  // --- EVENTS (HATS) ---
  
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

  Blockly.Blocks['event_when_obstacle'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("When obstacle detected");
          this.setNextStatement(true, null);
          this.setStyle('events_blocks');
          this.setTooltip("Trigger when robot hits an obstacle");
      }
  };

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

  Blockly.Blocks['robot_move'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Drive")
          .appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"]]), "DIRECTION")
          .appendField("distance")
          .appendField(new FieldNumpad(10), "DISTANCE")
          .appendField("cm");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks'); 
      this.setTooltip("Move the robot forward or backward");
    }
  };

  Blockly.Blocks['robot_move_speed'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Drive")
          .appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"]]), "DIRECTION")
          .appendField("distance")
          .appendField(new FieldNumpad(10), "DISTANCE")
          .appendField("cm speed")
          .appendField(new FieldNumpad(50, 0, 100), "SPEED")
          .appendField("%");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks'); 
      this.setTooltip("Move the robot forward or backward at a specific speed");
    }
  };

  Blockly.Blocks['robot_move_until'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Drive")
          .appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"]]), "DIRECTION")
          .appendField("until");
      this.appendValueInput("CONDITION")
          .setCheck("Boolean");
      this.appendDummyInput()
          .appendField("at speed")
          .appendField(new FieldNumpad(50, 0, 100), "SPEED")
          .appendField("%");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks'); 
      this.setTooltip("Move until condition is met");
    }
  };
  
  Blockly.Blocks['robot_stop'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("Stop Moving");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setStyle('motion_blocks');
          this.setTooltip("Stop the robot");
      }
  };

  Blockly.Blocks['robot_turn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Turn")
          .appendField(new Blockly.FieldDropdown([["Right","RIGHT"], ["Left","LEFT"]]), "DIRECTION")
          .appendField("angle")
          .appendField(new FieldNumpad(90), "ANGLE")
          .appendField("degrees");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('motion_blocks');
      this.setTooltip("Turn the robot");
    }
  };

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

  Blockly.Blocks['robot_led'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Set LED")
          .appendField(new Blockly.FieldDropdown([["Left","LEFT"], ["Right","RIGHT"], ["Both","BOTH"]]), "SIDE")
          .appendField("color")
          .appendField(new FieldColorDropper("#ff0000"), "COLOR"); // Using 3D Dropper
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('looks_blocks');
      this.setTooltip("Change the robot LED color");
    }
  };

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
  
   Blockly.Blocks['robot_wait'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Wait")
          .appendField(new FieldNumpad(1), "SECONDS")
          .appendField("seconds");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('control_blocks');
      this.setTooltip("Pause the program");
    }
  };

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

  Blockly.Blocks['sensor_ultrasonic'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Distance to obstacle (cm)");
      this.setOutput(true, "Number");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns distance to nearest object");
    }
  };

  Blockly.Blocks['sensor_touch'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Touch sensor pressed?");
      this.setOutput(true, "Boolean");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns true if robot hits a wall");
    }
  };

  Blockly.Blocks['sensor_gyro'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Gyro Angle");
      this.setOutput(true, "Number");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns current robot orientation");
    }
  };

  Blockly.Blocks['sensor_color'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Detected Color");
      this.setOutput(true, "String");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns the color seen by the robot (white/black)");
    }
  };

  // --- UPDATED BLOCK WITH NEW FIELD ---
  Blockly.Blocks['sensor_touching_color'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("touching color")
          // Use FieldColorDropper instead of FieldColour
          .appendField(new FieldColorDropper("#ffbf00"), "COLOR")
          .appendField("?");
      this.setOutput(true, "Boolean");
      this.setStyle('sensors_blocks');
      this.setTooltip("Checks if the robot is touching a specific color");
    }
  };

  Blockly.Blocks['sensor_circumference'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Wheel Circumference (cm)");
      this.setOutput(true, "Number");
      this.setStyle('sensors_blocks');
      this.setTooltip("Returns the circumference of the robot wheel");
    }
  };


  // --- DEFINE GENERATORS ---

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
    const distVal = direction === 'BACKWARD' ? -distance : distance;
    return `await robot.move(${distVal});\n`;
  };

  javascriptGenerator.forBlock['robot_move_speed'] = function(block: any) {
    const direction = block.getFieldValue('DIRECTION');
    const distance = block.getFieldValue('DISTANCE');
    const speed = block.getFieldValue('SPEED');
    const distVal = direction === 'BACKWARD' ? -distance : distance;
    return `await robot.setSpeed(${speed});\nawait robot.move(${distVal});\n`;
  };

  javascriptGenerator.forBlock['robot_move_until'] = function(block: any) {
    const direction = block.getFieldValue('DIRECTION');
    const speed = block.getFieldValue('SPEED');
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    const distStep = direction === 'BACKWARD' ? -0.2 : 0.2;
    return `
    await robot.setSpeed(${speed});
    while (!(${condition})) {
      await robot.move(${distStep});
    }
    `;
  };
  
  javascriptGenerator.forBlock['robot_stop'] = function(block: any) {
      return 'await robot.stop();\n';
  };

  javascriptGenerator.forBlock['robot_turn'] = function(block: any) {
    const direction = block.getFieldValue('DIRECTION');
    const angle = block.getFieldValue('ANGLE');
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
      return `robot.setLed('${side.toLowerCase()}', 'black');\n`;
  };
  
  javascriptGenerator.forBlock['robot_wait'] = function(block: any) {
    const seconds = block.getFieldValue('SECONDS');
    return `await robot.wait(${seconds * 1000});\n`;
  };

  javascriptGenerator.forBlock['math_number'] = function(block: any) {
      const code = parseFloat(block.getFieldValue('NUM'));
      const order = code >= 0 ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_UNARY_NEGATION;
      return [code, order];
  }

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

  javascriptGenerator.forBlock['sensor_touching_color'] = function(block: any) {
    const color = block.getFieldValue('COLOR'); // Returns Hex string e.g. '#ff0000'
    return [`await robot.isTouchingColor('${color}')`, javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };

  javascriptGenerator.forBlock['sensor_circumference'] = function(block: any) {
    return ['await robot.getCircumference()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  };
};

export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Events",
      categorystyle: "events_category",
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
      categorystyle: "motion_category",
      cssConfig: { "container": "category-motion" },
      contents: [
        { kind: "block", type: "robot_move" },
        { kind: "block", type: "robot_move_speed" }, 
        { kind: "block", type: "robot_move_until" },
        { kind: "block", type: "robot_stop" },
        { kind: "block", type: "robot_turn" },
        { kind: "block", type: "robot_set_speed" },
      ]
    },
    {
      kind: "category",
      name: "Looks",
      categorystyle: "looks_category",
      cssConfig: { "container": "category-looks" },
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
        { kind: "block", type: "sensor_touching_color" },
        { kind: "block", type: "sensor_circumference" },
      ]
    },
    {
      kind: "category",
      name: "Control",
      categorystyle: "control_category",
      cssConfig: { "container": "category-control" },
      contents: [
        { kind: "block", type: "robot_wait" },
        { kind: "block", type: "controls_repeat_ext", inputs: { TIMES: { shadow: { type: "math_number", fields: { NUM: 5 } } } } },
        { kind: "block", type: "controls_if" },
      ]
    },
    {
        kind: "category",
        name: "Logic",
        categorystyle: "logic_category",
        cssConfig: { "container": "category-logic" },
        contents: [
            { 
              kind: "block", 
              type: "logic_compare",
              inputs: {
                A: { shadow: { type: "math_number", fields: { NUM: 10 } } },
                B: { shadow: { type: "math_number", fields: { NUM: 10 } } }
              }
            },
            { kind: "block", type: "logic_operation" },
            { kind: "block", type: "logic_boolean" },
            { 
              kind: "block", 
              type: "math_arithmetic",
              inputs: {
                A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                B: { shadow: { type: "math_number", fields: { NUM: 1 } } }
              }
            },
            { kind: "block", type: "math_number" },
        ]
    }
  ]
};
