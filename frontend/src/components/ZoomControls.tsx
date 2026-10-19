import React from 'react';
import { Minus, Plus, Undo2, Redo2, HelpCircle } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenHelp: () => void;
  isDark: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenHelp,
  isDark,
}) => {
  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2 pointer-events-auto">
      {/* Zoom controls island */}
      <div
        className={`flex items-center gap-0.5 p-1 rounded-lg border shadow-island transition-colors ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        <button
          onClick={onZoomOut}
          title="Zoom out (Ctrl + -)"
          className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetZoom}
          title="Reset zoom to 100% (Shift + 0)"
          className={`px-2 py-1 text-xs font-mono font-medium rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors min-w-[52px] text-center`}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          title="Zoom in (Ctrl + +)"
          className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Undo & Redo island */}
      <div
        className={`flex items-center gap-0.5 p-1 rounded-lg border shadow-island transition-colors ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded transition-colors ${
            canUndo
              ? 'hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-700 dark:text-gray-300'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          className={`p-1.5 rounded transition-colors ${
            canRedo
              ? 'hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-700 dark:text-gray-300'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Help button */}
      <button
        onClick={onOpenHelp}
        title="Help & Shortcuts (?)"
        className={`p-2 rounded-lg border shadow-island transition-colors ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0] hover:bg-[#2e2e38]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c] hover:bg-gray-100'
        }`}
      >
        <HelpCircle className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
      </button>
    </div>
  );
};
