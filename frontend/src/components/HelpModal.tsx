import React from 'react';
import { X, HelpCircle, Keyboard } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Tools',
      items: [
        { key: 'V / 1', desc: 'Selection tool' },
        { key: 'H / 2', desc: 'Hand (Panning tool)' },
        { key: 'R / 3', desc: 'Rectangle tool' },
        { key: 'D / 4', desc: 'Diamond tool' },
        { key: 'O / 5', desc: 'Ellipse tool' },
        { key: 'A / 6', desc: 'Arrow tool' },
        { key: 'L / 7', desc: 'Line tool' },
        { key: 'P / 8', desc: 'Draw (Pencil tool)' },
        { key: 'T / 9', desc: 'Text tool' },
        { key: 'E / 0', desc: 'Eraser tool' },
        { key: 'K', desc: 'Laser pointer (Laser pen)' },
      ],
    },
    {
      category: 'Canvas & Navigation',
      items: [
        { key: 'Space + Drag', desc: 'Pan canvas freely' },
        { key: 'Mouse Wheel', desc: 'Pan canvas vertically' },
        { key: 'Ctrl + Wheel', desc: 'Zoom centered at mouse cursor' },
        { key: 'Shift + 0', desc: 'Reset zoom to 100%' },
        { key: 'Ctrl + /', desc: 'Command palette' },
        { key: 'Ctrl + F', desc: 'Find text or shape on canvas' },
      ],
    },
    {
      category: 'Editing & Selection',
      items: [
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'Ctrl + A', desc: 'Select all elements' },
        { key: 'Ctrl + D', desc: 'Duplicate selected elements' },
        { key: 'Del / Backspace', desc: 'Delete selected elements' },
        { key: 'Ctrl + [', desc: 'Send to back' },
        { key: 'Ctrl + ]', desc: 'Bring to front' },
        { key: 'Escape', desc: 'Deselect / Cancel active action' },
      ],
    },
    {
      category: 'Files & Export',
      items: [
        { key: 'Ctrl + S', desc: 'Save to .excalidraw file' },
        { key: 'Ctrl + O', desc: 'Open .excalidraw file' },
        { key: 'Ctrl + Shift + E', desc: 'Export image (PNG / SVG)' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-dialog overflow-hidden flex flex-col max-h-[85vh] transition-all ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-sm">Keyboard Shortcuts & Help</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-sans">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                {section.category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#1e1e24] border-[#34343e]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {item.desc}
                    </span>
                    <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a34] text-gray-700 dark:text-gray-300 shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
