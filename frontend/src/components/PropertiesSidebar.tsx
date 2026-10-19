import React from 'react';
import {
  Copy,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  Hash,
  Sparkles,
} from 'lucide-react';
import { ElementProperties, FillStyle, Roughness, StrokeStyle } from '../types/canvas';

interface PropertiesSidebarProps {
  properties: ElementProperties;
  onChange: (updates: Partial<ElementProperties>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  hasSelection: boolean;
  isDark: boolean;
}

const STROKE_COLORS = [
  '#1e1e1e', // black
  '#e03131', // red
  '#2f9e44', // green
  '#1971c2', // blue
  '#f08c00', // orange
  '#9c36b5', // violet
  '#099268', // teal
  '#ffffff', // white
];

const BG_COLORS = [
  'transparent',
  '#ffc9c9', // light red
  '#b2f2bb', // light green
  '#a5d8ff', // light blue
  '#ffec99', // light yellow
  '#eebefa', // light purple
  '#c3fae8', // light teal
  '#f1f3f5', // light gray
];

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  properties,
  onChange,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  hasSelection,
  isDark,
}) => {
  return (
    <aside
      className={`fixed top-16 left-3 z-20 w-64 p-3.5 rounded-xl border shadow-island transition-all overflow-y-auto max-h-[calc(100vh-5rem)] pointer-events-auto ${
        isDark
          ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
          : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
      }`}
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Stroke Color */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Stroke
          </label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {STROKE_COLORS.map((color) => {
              const isSelected = properties.strokeColor === color;
              return (
                <button
                  key={color}
                  onClick={() => onChange({ strokeColor: color })}
                  className={`w-6 h-6 rounded-md border transition-transform ${
                    isSelected ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'hover:scale-105'
                  } ${isDark ? 'border-[#444]' : 'border-gray-200'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              );
            })}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={properties.strokeColor}
                onChange={(e) => onChange({ strokeColor: e.target.value })}
                className="sr-only"
              />
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-md border text-[10px] ${
                  isDark ? 'border-[#444] bg-[#2a2a34]' : 'border-gray-200 bg-gray-50'
                }`}
                title="Custom color"
              >
                <Hash className="w-3 h-3 text-gray-400" />
              </span>
            </label>
          </div>
        </div>

        {/* Background / Fill Color */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Background
          </label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {BG_COLORS.map((color) => {
              const isSelected = properties.backgroundColor === color;
              const isTransparent = color === 'transparent';
              return (
                <button
                  key={color}
                  onClick={() => onChange({ backgroundColor: color })}
                  className={`w-6 h-6 rounded-md border transition-transform relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'hover:scale-105'
                  } ${isDark ? 'border-[#444]' : 'border-gray-200'}`}
                  style={{ backgroundColor: isTransparent ? undefined : color }}
                  title={color}
                >
                  {isTransparent && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-[1px] bg-red-400 rotate-45 transform" />
                    </span>
                  )}
                </button>
              );
            })}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={properties.backgroundColor === 'transparent' ? '#ffffff' : properties.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="sr-only"
              />
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-md border text-[10px] ${
                  isDark ? 'border-[#444] bg-[#2a2a34]' : 'border-gray-200 bg-gray-50'
                }`}
                title="Custom background color"
              >
                <Hash className="w-3 h-3 text-gray-400" />
              </span>
            </label>
          </div>
        </div>

        {/* Fill Style */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Fill Style
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['none', 'hachure', 'cross-hatch', 'solid'] as FillStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => onChange({ fillStyle: style })}
                className={`py-1 px-1.5 rounded text-center capitalize text-[11px] font-medium transition-colors ${
                  properties.fillStyle === style
                    ? isDark
                      ? 'bg-[#3b387e] text-[#a5b4fc]'
                      : 'bg-[#e0dfff] text-[#5551c9]'
                    : isDark
                    ? 'hover:bg-[#2c2c36] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {style === 'cross-hatch' ? 'Cross' : style}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Stroke Width
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { val: 1, label: 'Thin' },
              { val: 2, label: 'Med' },
              { val: 4, label: 'Bold' },
              { val: 6, label: 'X-Bold' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => onChange({ strokeWidth: val })}
                className={`py-1 px-1.5 rounded text-center text-[11px] font-medium transition-colors ${
                  properties.strokeWidth === val
                    ? isDark
                      ? 'bg-[#3b387e] text-[#a5b4fc]'
                      : 'bg-[#e0dfff] text-[#5551c9]'
                    : isDark
                    ? 'hover:bg-[#2c2c36] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Style */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Stroke Style
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => onChange({ strokeStyle: style })}
                className={`py-1 px-1.5 rounded text-center capitalize text-[11px] font-medium transition-colors ${
                  properties.strokeStyle === style
                    ? isDark
                      ? 'bg-[#3b387e] text-[#a5b4fc]'
                      : 'bg-[#e0dfff] text-[#5551c9]'
                    : isDark
                    ? 'hover:bg-[#2c2c36] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Sloppiness / Roughness */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Sloppiness (Roughness)
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { val: 0, label: 'Architect' },
              { val: 1, label: 'Artist' },
              { val: 2, label: 'Cartoonist' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => onChange({ roughness: val as Roughness })}
                className={`py-1 px-1 rounded text-center text-[11px] font-medium transition-colors ${
                  properties.roughness === val
                    ? isDark
                      ? 'bg-[#3b387e] text-[#a5b4fc]'
                      : 'bg-[#e0dfff] text-[#5551c9]'
                    : isDark
                    ? 'hover:bg-[#2c2c36] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Edges */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Edges
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(['sharp', 'round'] as ('sharp' | 'round')[]).map((edge) => (
              <button
                key={edge}
                onClick={() => onChange({ roundness: edge })}
                className={`py-1 px-1.5 rounded text-center capitalize text-[11px] font-medium transition-colors ${
                  properties.roundness === edge
                    ? isDark
                      ? 'bg-[#3b387e] text-[#a5b4fc]'
                      : 'bg-[#e0dfff] text-[#5551c9]'
                    : isDark
                    ? 'hover:bg-[#2c2c36] text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {edge}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Opacity
            </label>
            <span className="text-[11px] text-gray-500 font-mono">
              {properties.opacity}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={properties.opacity}
            onChange={(e) => onChange({ opacity: parseInt(e.target.value, 10) })}
            className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Actions for Selected Elements */}
        {hasSelection && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Actions
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onBringToFront}
                className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded border text-xs transition-colors ${
                  isDark
                    ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                title="Bring to Front"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
                <span>Front</span>
              </button>
              <button
                onClick={onSendToBack}
                className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded border text-xs transition-colors ${
                  isDark
                    ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                title="Send to Back"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={onDuplicate}
                className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded border text-xs transition-colors ${
                  isDark
                    ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-1.5 py-1 px-2 rounded border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs transition-colors"
                title="Delete (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
