import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  width?: string;
  height?: string;
}

export function DraggableWindow({ 
  title, 
  onClose, 
  children, 
  defaultPosition = { x: 50, y: 50 },
  width = '500px',
  height = '400px'
}: DraggableWindowProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragHandle=".window-titlebar"
      initial={defaultPosition}
      className="absolute bg-white border border-slate-400 shadow-2xl flex flex-col pointer-events-auto z-50 rounded ring-4 ring-slate-800/10 overflow-hidden"
      style={{ width, height }}
      onPointerDown={(e) => {
        // Simple bring to front by appending to DOM end in a more complex setup, 
        // but for now z-50 is fine.
      }}
    >
      {/* Title Bar */}
      <div className="window-titlebar bg-blue-800 text-white px-3 py-1.5 text-xs font-bold flex justify-between items-center cursor-grab active:cursor-grabbing select-none">
        <span>{title}</span>
        <div className="flex gap-1 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-3 h-3 bg-red-500/80 rounded-sm hover:bg-red-500 transition-colors focus:outline-none flex items-center justify-center p-0"
          >
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-4 bg-white overflow-auto flex flex-col gap-3">
        {children}
      </div>
    </motion.div>
  );
}
