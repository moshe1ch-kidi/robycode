
import React, { useEffect, useState } from 'react';
import { Delete, Check, Minus } from 'lucide-react';

interface NumpadProps {
  initialValue: string | number;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (value: number) => void;
}

const Numpad: React.FC<NumpadProps> = ({ initialValue, position, onClose, onSubmit }) => {
  // Always start at '0' to allow fresh input, ignoring the current block value
  const [value, setValue] = useState<string>('0');

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.numpad-container')) {
        onClose();
      }
    };
    // Delay adding listener to avoid immediate close on open click
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const handleNumber = (num: string) => {
    if (value === '0' && num !== '.') {
      setValue(num);
    } else {
      setValue(prev => prev + num);
    }
  };

  const handleDecimal = () => {
    if (!value.includes('.')) {
      setValue(prev => prev + '.');
    }
  };

  const handleNegative = () => {
    if (value.startsWith('-')) {
      setValue(prev => prev.substring(1));
    } else {
      setValue(prev => '-' + prev);
    }
  };

  const handleBackspace = () => {
    setValue(prev => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
    });
  };

  const handleSubmit = () => {
    onSubmit(parseFloat(value) || 0);
    onClose();
  };

  // Prevent numpad from going off-screen
  const adjustedX = Math.min(Math.max(position.x - 120, 10), window.innerWidth - 260);
  const adjustedY = Math.min(Math.max(position.y + 20, 10), window.innerHeight - 350);

  const btnClass = "flex items-center justify-center text-xl font-bold rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all h-14";

  return (
    <div 
      className="numpad-container fixed z-[9999] bg-slate-800 p-4 rounded-3xl shadow-2xl border-4 border-slate-700 w-[280px]"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {/* Display */}
      <div className="bg-slate-900 text-white text-3xl font-mono p-4 rounded-xl mb-4 text-right border-2 border-slate-600 tracking-wider overflow-hidden">
        {value}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 */}
        <button onClick={() => handleNumber('7')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>7</button>
        <button onClick={() => handleNumber('8')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>8</button>
        <button onClick={() => handleNumber('9')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>9</button>
        <button onClick={handleBackspace} className={`${btnClass} bg-red-500 text-white hover:bg-red-400`}>
          <Delete size={20} />
        </button>

        {/* Row 2 */}
        <button onClick={() => handleNumber('4')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>4</button>
        <button onClick={() => handleNumber('5')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>5</button>
        <button onClick={() => handleNumber('6')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>6</button>
        <button onClick={handleNegative} className={`${btnClass} bg-amber-500 text-white hover:bg-amber-400`}>
           <Minus size={20} />
        </button>

        {/* Row 3 */}
        <button onClick={() => handleNumber('1')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>1</button>
        <button onClick={() => handleNumber('2')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>2</button>
        <button onClick={() => handleNumber('3')} className={`${btnClass} bg-indigo-500 text-white hover:bg-indigo-400`}>3</button>
        {/* Decimal - Spans 1 row, simple color */}
        <button onClick={handleDecimal} className={`${btnClass} bg-slate-600 text-white hover:bg-slate-500`}>.</button>

        {/* Row 4 */}
        <button onClick={() => handleNumber('0')} className={`${btnClass} col-span-2 bg-indigo-500 text-white hover:bg-indigo-400`}>0</button>
        <button onClick={handleSubmit} className={`${btnClass} col-span-2 bg-emerald-500 text-white hover:bg-emerald-400`}>
          <Check size={28} />
        </button>
      </div>
    </div>
  );
};

export default Numpad;
