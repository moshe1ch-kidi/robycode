import React, { useEffect, useRef, useState } from 'react';
import { initBlockly, toolbox, getScratchTheme } from '../services/blocklySetup';

interface BlocklyEditorProps {
  onCodeChange: (code: string) => void;
  onEval?: (code: string) => Promise<any>;
}

// Bubble Component for displaying block values
const BlockBubble = ({ x, y, value }: { x: number, y: number, value: string | number | boolean }) => (
    <div 
        className="fixed z-50 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1 rounded-lg shadow-lg font-mono font-bold text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{ left: x, top: y - 10 }}
    >
        {String(value)}
        {/* Little triangle arrow at bottom */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-400"></div>
    </div>
);

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onCodeChange, onEval }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const [bubble, setBubble] = useState<{x: number, y: number, value: any} | null>(null);

  // FIXED: Store callbacks in Refs so they are accessible inside listeners 
  // without triggering the main useEffect cleanup/re-init cycle.
  const onCodeChangeRef = useRef(onCodeChange);
  const onEvalRef = useRef(onEval);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
    onEvalRef.current = onEval;
  }, [onCodeChange, onEval]);

  useEffect(() => {
    // Access globally loaded Blockly here inside useEffect to ensures scripts are loaded
    const Blockly = (window as any).Blockly;
    const javascript = (window as any).javascript;

    // Ensure Blockly is loaded
    if (!Blockly || !javascript) {
        console.error("Blockly not loaded yet");
        return;
    }

    initBlockly();
    const scratchTheme = getScratchTheme();

    if (blocklyDiv.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox,
        rtl: false, // Changed to false for LTR
        scrollbars: true,
        renderer: 'zelos', // Use the Scratch-like renderer
        theme: scratchTheme, // Apply the Scratch-like colors
        grid: {
            spacing: 20,
            length: 3,
            colour: '#E6E6E6', // Lighter grid
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.8, // Start zoomed out slightly like Scratch
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true,
      });

      // Listener to generate code on change
      workspaceRef.current.addChangeListener((e: any) => {
        // Handle code generation for main app
        if (e.type !== Blockly.Events.UI && workspaceRef.current) {
            const code = javascript.javascriptGenerator.workspaceToCode(workspaceRef.current);
            // Call via Ref
            if (onCodeChangeRef.current) {
                onCodeChangeRef.current(code);
            }
        }

        // Handle Click for Evaluation (Bubbles)
        // Check if onEval exists via Ref
        if (e.type === Blockly.Events.CLICK && onEvalRef.current) {
            const blockId = e.blockId;
            if (!blockId) return;
            
            const block = workspaceRef.current.getBlockById(blockId);
            if (!block) return;

            // Only evaluate blocks that return a value (Output connection)
            if (block.outputConnection) {
                try {
                    const tuple = javascript.javascriptGenerator.blockToCode(block);
                    const code = Array.isArray(tuple) ? tuple[0] : tuple;
                    
                    if (code) {
                        onEvalRef.current(code).then((result: any) => {
                           // Calculate screen position of the block
                           // Use getSvgRoot() instead of getSvgGroup() which doesn't exist on all versions
                           const svgRoot = (block as any).getSvgRoot();
                           if (svgRoot) {
                               const rect = svgRoot.getBoundingClientRect();
                               
                               setBubble({
                                   x: rect.left + rect.width / 2,
                                   y: rect.top,
                                   value: result
                               });

                               // Hide bubble after 2.5 seconds
                               setTimeout(() => setBubble(null), 2500);
                           }
                        });
                    }
                } catch (err) {
                    console.error("Failed to eval block", err);
                }
            }
        }
      });
      
      // Initial trigger
      const code = javascript.javascriptGenerator.workspaceToCode(workspaceRef.current);
      if (onCodeChangeRef.current) {
          onCodeChangeRef.current(code);
      }
    }

    const handleResize = () => {
        if(workspaceRef.current && blocklyDiv.current) {
            Blockly.svgResize(workspaceRef.current);
        }
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  // FIXED: Empty dependency array ensures Blockly is only injected ONCE
  // and not destroyed when React state changes (like showing a bubble)
  }, []); 

  return (
    <div className="w-full h-full relative">
      <div ref={blocklyDiv} className="absolute inset-0" />
      {bubble && <BlockBubble x={bubble.x} y={bubble.y} value={bubble.value} />}
    </div>
  );
};

export default BlocklyEditor;