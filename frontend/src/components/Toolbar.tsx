import React from 'react';
import {
  MousePointer,
  Hand,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Zap,
  Lock,
  Unlock,
} from 'lucide-react';
import { Tool } from '../types/canvas';

interface ToolbarProps {
  currentTool: Tool;
  setTool: (tool: Tool) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isDark: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  isLocked,
  setIsLocked,
  isDark,
}) => {
  const tools: { id: Tool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Selection', icon: <MousePointer className="w-4 h-4" />, shortcut: '1 or V' },
    { id: 'pan', label: 'Hand (Panning tool)', icon: <Hand className="w-4 h-4" />, shortcut: '2 or H' },
    { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: '3 or R' },
    { id: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" />, shortcut: '4 or D' },
    { id: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" />, shortcut: '5 or O' },
    { id: 'arrow', label: 'Arrow', icon: <ArrowRight className="w-4 h-4" />, shortcut: '6 or A' },
    { id: 'line', label: 'Line', icon: <Minus className="w-4 h-4" />, shortcut: '7 or L' },
    { id: 'pencil', label: 'Draw (Pencil)', icon: <Pencil className="w-4 h-4" />, shortcut: '8 or P' },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, shortcut: '9 or T' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, shortcut: '0 or E' },
    { id: 'laser', label: 'Laser pointer', icon: <Zap className="w-4 h-4 text-rose-500" />, shortcut: 'K' },
  ];

  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border shadow-island transition-colors ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        {/* Tool Lock Button */}
        <button
          onClick={() => setIsLocked(!isLocked)}
          title={`Lock tool: Keep selected tool active (${isLocked ? 'Locked' : 'Unlocked'})`}
          className={`p-2 rounded-md transition-colors ${
            isLocked
              ? isDark
                ? 'bg-[#3b387e] text-[#a5b4fc]'
                : 'bg-[#e0dfff] text-[#5551c9]'
              : isDark
              ? 'hover:bg-[#2e2e38] text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        <div className={`w-[1px] h-5 ${isDark ? 'bg-[#3a3a46]' : 'bg-[#e0e0e0]'}`} />

        {/* Tools list */}
        {tools.map((t) => {
          const isActive = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={`${t.label} - ${t.shortcut}`}
              className={`p-2 rounded-md transition-all flex items-center justify-center relative group ${
                isActive
                  ? isDark
                    ? 'bg-[#3b387e] text-[#a5b4fc] shadow-sm'
                    : 'bg-[#e0dfff] text-[#5551c9] shadow-sm'
                  : isDark
                  ? 'hover:bg-[#2c2c36] text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t.icon}
              {/* Shortcut number indicator */}
              <span className="sr-only">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
