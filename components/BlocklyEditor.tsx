
import React, { useEffect, useRef, useState } from 'react';
import * as BlocklyImport from 'blockly';
import { TOOLBOX_XML } from '../constants';
import { initCustomBlocks, generateCommandsFromBlock, evaluateBlockValue } from '../services/blocklyService';
import { Command } from '../types';

// Handle ESM import differences
const Blockly = (BlocklyImport as any).default || BlocklyImport;

interface BlocklyEditorProps {
  onWorkspaceChange: (workspace: BlocklyImport.WorkspaceSvg) => void;
  onRunBlock?: (commands: Command[]) => void;
}

// Define Scratch 3.0 Theme
const ScratchTheme = Blockly.Theme?.defineTheme('scratch', {
  base: Blockly.Themes?.Classic,
  blockStyles: {
    // We map the standard Blockly styles to Scratch colors
    // Note: Custom blocks use the 'colour' field directly, so these affect standard blocks
    logic_blocks: { colourPrimary: "#59C059", colourSecondary: "#46B946", colourTertiary: "#389438" },
    loop_blocks: { colourPrimary: "#FFAB19", colourSecondary: "#EC9C13", colourTertiary: "#CF8B17" },
    math_blocks: { colourPrimary: "#59C059", colourSecondary: "#46B946", colourTertiary: "#389438" },
    text_blocks: { colourPrimary: "#59C059", colourSecondary: "#46B946", colourTertiary: "#389438" },
    list_blocks: { colourPrimary: "#FF6680", colourSecondary: "#FF4D6A", colourTertiary: "#FF3355" },
    variable_blocks: { colourPrimary: "#FF8C1A", colourSecondary: "#DB6E00", colourTertiary: "#BD6000" },
    variable_dynamic_blocks: { colourPrimary: "#FF8C1A", colourSecondary: "#DB6E00", colourTertiary: "#BD6000" },
    procedure_blocks: { colourPrimary: "#FF6680", colourSecondary: "#FF4D6A", colourTertiary: "#FF3355" }
  },
  componentStyles: {
    workspaceBackgroundColour: '#F9F9F9',
    toolboxBackgroundColour: '#FFFFFF',
    toolboxForegroundColour: '#575E75',
    flyoutBackgroundColour: '#F9F9F9',
    flyoutForegroundColour: '#575E75',
    flyoutOpacity: 1,
    scrollbarColour: '#CECDCE',
    insertionMarkerColour: '#000000',
    insertionMarkerOpacity: 0.2,
    markerColour: '#4285f4',
    cursorColour: '#d0d0d0',
  },
  fontStyle: {
    family: '"Rubik", "Helvetica Neue", Helvetica, Arial, sans-serif',
    weight: 'bold', // Scratch blocks use bold text
    size: 12
  },
  startHats: true // Scratch often has hats, though standard setup is event-based
});

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onWorkspaceChange, onRunBlock }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<BlocklyImport.WorkspaceSvg | null>(null);
  const [reportBubble, setReportBubble] = useState<{x: number, y: number, value: string} | null>(null);
  
  // Use a ref for the callback to prevent effect re-triggering when the callback identity changes
  const onRunBlockRef = useRef(onRunBlock);

  useEffect(() => {
    onRunBlockRef.current = onRunBlock;
  }, [onRunBlock]);

  useEffect(() => {
    if (!blocklyDiv.current) return;
    
    // Prevent double init
    if (workspaceRef.current) return;

    initCustomBlocks();

    if (Blockly.inject) {
        workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: TOOLBOX_XML,
        renderer: 'zelos', // The Scratch 3.0-like renderer
        theme: ScratchTheme, // Apply the custom theme
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.85,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        grid: {
          spacing: 20,
          length: 3,
          colour: '#e5e7eb',
          snap: false
        },
        trashcan: true,
        move: {
            scrollbars: true,
            drag: true,
            wheel: false
        },
        rtl: false, // LTR for English
        });

        const handleChange = () => {
          if (workspaceRef.current) {
              onWorkspaceChange(workspaceRef.current);
          }
        };

        const handleBlockClick = (e: any) => {
          // Check if this is a UI click on a block (and not a drag end)
          if (e.type === Blockly.Events.CLICK && e.targetType === 'block' && workspaceRef.current) {
            const block = workspaceRef.current.getBlockById(e.blockId);
            
            if (!block) return;
            
            // IGNORE SHADOW BLOCKS (inputs)
            if (block.isShadow()) return;

            // 1. HANDLE REPORTER (OUTPUT) BLOCKS -> Show Bubble
            if (block.outputConnection) {
                 const value = evaluateBlockValue(block);
                 if (value !== null && value !== undefined) {
                     const svgRoot = block.getSvgRoot();
                     if (svgRoot) {
                         const rect = svgRoot.getBoundingClientRect();
                         const formattedValue = String(value).includes('.') && !isNaN(Number(value)) 
                            ? Number(value).toFixed(2) 
                            : String(value);

                         setReportBubble({
                             x: rect.right + 8,
                             y: rect.top + (rect.height / 2),
                             value: formattedValue
                         });
                         
                         // Clear previous timeout logic is handled by setting new timeout implicitly
                         // But to be clean we could use a ref, simpler here to just rely on re-render.
                         setTimeout(() => setReportBubble(null), 2500);
                     }
                 }
                 return;
            }
            
            // 2. HANDLE STATEMENT BLOCKS -> Execute
            if (onRunBlockRef.current) {
               const commands = generateCommandsFromBlock(block);
               if (commands.length > 0) {
                 onRunBlockRef.current(commands);
                 
                 // Visual feedback: Highlight the block briefly
                 // @ts-ignore
                 if(block.setHighlighted) {
                     // @ts-ignore
                    block.setHighlighted(true);
                    setTimeout(() => {
                        // @ts-ignore
                        if (block.setHighlighted) block.setHighlighted(false);
                    }, 200);
                 }
               }
            }
          }
        };
        
        // Hide bubble on viewport change (scrolling/panning)
        const handleUiChange = (e: any) => {
           if (e.type === Blockly.Events.VIEWPORT_CHANGE) {
               setReportBubble(null);
           }
        };

        workspaceRef.current.addChangeListener(handleChange);
        workspaceRef.current.addChangeListener(handleBlockClick);
        workspaceRef.current.addChangeListener(handleUiChange);

        // Initial resize to fit container
        window.setTimeout(() => {
            if (workspaceRef.current && Blockly.svgResize) {
                Blockly.svgResize(workspaceRef.current);
            }
        }, 100);
    } else {
        console.error("Blockly.inject not found");
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  // Dependency array should NOT include onRunBlock
  }, [onWorkspaceChange]);

  return (
    <div className="w-full h-full relative">
      <div ref={blocklyDiv} className="absolute inset-0 w-full h-full text-left" />
      
      {/* Reporter Bubble Overlay */}
      {reportBubble && (
         <div 
            className="fixed z-50 bg-white border-2 border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg shadow-xl font-mono text-sm font-bold pointer-events-none animate-in fade-in zoom-in duration-150"
            style={{ 
                left: reportBubble.x, 
                top: reportBubble.y,
                transform: 'translateY(-50%)' 
            }}
         >
            {reportBubble.value}
            {/* Tiny arrow pointing left */}
            <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 border-8 border-transparent border-r-white drop-shadow-sm filter"></div>
         </div>
      )}
    </div>
  );
};

export default BlocklyEditor;
