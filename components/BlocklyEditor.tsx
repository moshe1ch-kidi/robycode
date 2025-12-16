import React, { useEffect, useRef } from 'react';
import { initBlockly, toolbox, getScratchTheme } from '../services/blocklySetup';

interface BlocklyEditorProps {
  onCodeChange: (code: string) => void;
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onCodeChange }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);

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
      workspaceRef.current.addChangeListener(() => {
        if(workspaceRef.current) {
            const code = javascript.javascriptGenerator.workspaceToCode(workspaceRef.current);
            onCodeChange(code);
        }
      });
      
      // Initial trigger
      const code = javascript.javascriptGenerator.workspaceToCode(workspaceRef.current);
      onCodeChange(code);
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
      }
    };
  }, [onCodeChange]);

  return (
    <div className="w-full h-full relative">
      <div ref={blocklyDiv} className="absolute inset-0" />
    </div>
  );
};

export default BlocklyEditor;