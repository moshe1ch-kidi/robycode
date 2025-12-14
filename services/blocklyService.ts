
import * as BlocklyImport from 'blockly';
import * as JavaScript from 'blockly/javascript';
import * as En from 'blockly/msg/en';
import { CUSTOM_BLOCKS, WHEEL_CIRCUMFERENCE } from '../constants';
import { Command, CommandType } from '../types';

// Handle ESM import differences for the main Blockly object
const Blockly = (BlocklyImport as any).default || BlocklyImport;

// --- Custom Field Registration for Numpad ---
// We create a custom field that inherits from FieldNumber but overrides the editor.
class FieldScratchNumber extends Blockly.FieldNumber {
  constructor(value?: string | number, min?: string | number, max?: string | number, precision?: string | number, validator?: any, config?: any) {
    super(value, min, max, precision, validator, config);
  }

  // Override the showEditor_ method to trigger our React Numpad
  showEditor_() {
    // We can't render React here directly easily, so we dispatch a custom event
    // that the main App component listens to.
    
    // Get the position of the field to position the numpad
    const box = this.getClickTarget_()?.getBoundingClientRect();
    
    if (box) {
      const event = new CustomEvent('open-numpad', {
        detail: {
          initialValue: this.getValue(),
          position: { x: box.left, y: box.bottom },
          callback: (newValue: number) => {
            this.setValue(newValue);
            // Force re-render of block if needed
            this.forceRerender(); 
          }
        }
      });
      window.dispatchEvent(event);
    }
  }
}

// Register the custom field type
if (Blockly.fieldRegistry) {
    // Only register if not already registered (Hot reload safety)
    try {
      Blockly.fieldRegistry.register('field_scratch_number', FieldScratchNumber);
    } catch (e) {
      // Ignore error if already registered
    }
}


// Helper to resolve the generator instance from various ESM/CJS structures
const getJavascriptGenerator = () => {
  const js = JavaScript as any;
  let generator = null;

  // 1. Try named export
  if (js.javascriptGenerator) {
    generator = js.javascriptGenerator;
  }
  // 2. Try default export (could be the generator itself or an object containing it)
  else if (js.default) {
    if (js.default.javascriptGenerator) {
      generator = js.default.javascriptGenerator;
    } else if (typeof js.default.blockToCode === 'function') {
      generator = js.default;
    }
  }

  // Fallback: if we still don't have it, maybe the module namespace itself is the generator (rare)
  if (!generator && typeof js.blockToCode === 'function') {
      generator = js;
  }

  // Safety patch: Ensure forBlock exists. 
  // In some versions/builds, you assign directly to the generator instance.
  if (generator && !generator.forBlock) {
     generator.forBlock = generator;
  }

  return generator;
};

const javascriptGenerator = getJavascriptGenerator();

// Set English Locale
const locale = (En as any).default || En;
if (Blockly.setLocale) {
  Blockly.setLocale(locale);
} else {
    console.warn("Blockly.setLocale not found on imported object");
}

// Initialize Custom Blocks
export const initCustomBlocks = () => {
  // Check existence on the resolved Blockly object
  if (Blockly.Blocks && Blockly.Blocks['robot_move']) return; 

  // Define blocks structure
  if (Blockly.defineBlocksWithJsonArray) {
    Blockly.defineBlocksWithJsonArray(CUSTOM_BLOCKS);
  } else {
      console.error("Blockly.defineBlocksWithJsonArray not found");
  }

  // Define generators
  if (javascriptGenerator) {
    // We use bracket notation to be safe if forBlock was polyfilled to self
    
    javascriptGenerator.forBlock['robot_start'] = (block: any) => {
      // This block acts as an entry point. It doesn't generate a command itself,
      // but allows the connected blocks to generate theirs.
      return '';
    };

    javascriptGenerator.forBlock['robot_number'] = (block: any) => {
      // This helper block simply returns the number value
      const num = block.getFieldValue('NUM');
      return [num, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock['robot_move'] = (block: any) => {
      const steps = block.getFieldValue('STEPS');
      return `commands.push({ type: '${CommandType.MOVE}', value: ${steps} });\n`;
    };

    javascriptGenerator.forBlock['robot_move_dir'] = (block: any) => {
      const direction = block.getFieldValue('DIRECTION');
      // Now we read from the input value (connected block or shadow) instead of a field
      const stepsCode = javascriptGenerator.valueToCode(block, 'STEPS', javascriptGenerator.ORDER_ATOMIC) || '0';
      const unit = block.getFieldValue('UNIT');
      
      const valExpression = direction === 'BACKWARD' ? `(-1 * (${stepsCode}))` : `(${stepsCode})`;
      
      return `commands.push({ type: '${CommandType.MOVE}', value: ${valExpression}, unit: '${unit}' });\n`;
    };

    javascriptGenerator.forBlock['robot_start_motor'] = (block: any) => {
        const direction = block.getFieldValue('DIRECTION');
        return `commands.push({ type: '${CommandType.START_MOTOR}', value: '${direction}' });\n`;
    };

    javascriptGenerator.forBlock['robot_stop_motors'] = (block: any) => {
        return `commands.push({ type: '${CommandType.STOP_MOTORS}' });\n`;
    };

    javascriptGenerator.forBlock['robot_turn_right'] = (block: any) => {
      const degrees = block.getFieldValue('DEGREES');
      return `commands.push({ type: '${CommandType.ROTATE}', value: ${degrees} });\n`;
    };

    javascriptGenerator.forBlock['robot_turn_left'] = (block: any) => {
      const degrees = block.getFieldValue('DEGREES');
      return `commands.push({ type: '${CommandType.ROTATE}', value: -${degrees} });\n`;
    };

    javascriptGenerator.forBlock['robot_set_speed'] = (block: any) => {
      const speed = block.getFieldValue('SPEED');
      return `commands.push({ type: '${CommandType.SET_SPEED}', value: ${speed} });\n`;
    };
    
    javascriptGenerator.forBlock['robot_wheel_circumference'] = (block: any) => {
      return [String(WHEEL_CIRCUMFERENCE), javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock['robot_set_color'] = (block: any) => {
      const color = block.getFieldValue('COLOR');
      return `commands.push({ type: '${CommandType.SET_COLOR}', value: '${color}' });\n`;
    };

    javascriptGenerator.forBlock['robot_wait'] = (block: any) => {
        const seconds = javascriptGenerator.valueToCode(block, 'SECONDS', javascriptGenerator.ORDER_ATOMIC) || '1';
        return `commands.push({ type: '${CommandType.WAIT}', value: ${seconds} });\n`;
    };

    // WAIT UNTIL Generator
    javascriptGenerator.forBlock['robot_wait_until'] = (block: any) => {
      // We need to inspect the block connected to the CONDITION input
      const conditionBlock = block.getInputTargetBlock('CONDITION');
      let conditionType = 'UNKNOWN';
      
      if (conditionBlock) {
          if (conditionBlock.type === 'robot_is_pressed') {
              conditionType = 'TOUCH';
          } 
      }

      // We push a special WAIT_UNTIL command with the type of sensor to wait for
      return `commands.push({ type: '${CommandType.WAIT_UNTIL}', value: '${conditionType}' });\n`;
    };

    // Sensor Generators
    javascriptGenerator.forBlock['robot_get_distance'] = (block: any) => {
      return ['100', javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock['robot_is_pressed'] = (block: any) => {
      return ['false', javascriptGenerator.ORDER_ATOMIC];
    };

  } else {
    console.error('Blockly JavaScript Generator not found');
  }
};

export const generateCommands = (workspace: BlocklyImport.WorkspaceSvg): Command[] => {
  if (!javascriptGenerator) {
    console.error('Blockly JavaScript Generator not initialized');
    return [];
  }

  // Ensure the generator starts fresh
  javascriptGenerator.init(workspace);
  
  // Custom preamble to define the array
  const code = javascriptGenerator.workspaceToCode(workspace);
  
  try {
    // eslint-disable-next-line no-new-func
    const runCode = new Function('commands', code);
    const commands: Command[] = [];
    runCode(commands);
    return commands;
  } catch (e) {
    console.error("Error generating code:", e);
    return [];
  }
};

export const generateCommandsFromBlock = (block: any): Command[] => {
  if (!javascriptGenerator) {
    console.error('Blockly JavaScript Generator not initialized');
    return [];
  }

  javascriptGenerator.init(block.workspace);

  const codeOrTuple = javascriptGenerator.blockToCode(block);
  let code = '';
  
  if (Array.isArray(codeOrTuple)) {
     return [];
  } else {
    code = codeOrTuple as string;
  }

  try {
    // eslint-disable-next-line no-new-func
    const runCode = new Function('commands', code);
    const commands: Command[] = [];
    runCode(commands);
    return commands;
  } catch (e) {
    console.error("Error generating block execution code:", e);
    return [];
  }
};

export const evaluateBlockValue = (block: any): any => {
  if (!javascriptGenerator) return null;
  javascriptGenerator.init(block.workspace);
  const codeOrTuple = javascriptGenerator.blockToCode(block);
  if (!Array.isArray(codeOrTuple)) {
      return null;
  }
  const code = codeOrTuple[0];
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return ${code}`)();
  } catch (e) {
    console.error("Error evaluating block:", e);
    return null;
  }
};
