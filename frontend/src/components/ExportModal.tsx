import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  Image,
  FileCode,
  Layers,
} from 'lucide-react';
import { CanvasElement } from '../types/canvas';
import {
  copyPngToClipboard,
  downloadPng,
  downloadSvg,
  exportToCanvas,
} from '../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  canvasBg: string;
  title: string;
  isDark: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  canvasBg,
  title,
  isDark,
}) => {
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [scale, setScale] = useState<number>(2);
  const [withBackground, setWithBackground] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Render live preview on canvas
  useEffect(() => {
    if (!isOpen || !previewContainerRef.current) return;

    previewContainerRef.current.innerHTML = '';
    const canvas = exportToCanvas(elements, {
      scale: 1,
      withBackground,
      backgroundColor: withBackground ? (isDark ? '#121212' : canvasBg) : 'transparent',
      padding: 20,
    });

    if (canvas) {
      canvas.className = 'max-w-full max-h-56 object-contain rounded shadow-xs';
      previewContainerRef.current.appendChild(canvas);
    } else {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'py-12 text-center text-xs text-gray-400';
      emptyMsg.innerText = 'Canvas is empty. Draw some shapes to export!';
      previewContainerRef.current.appendChild(emptyMsg);
    }
  }, [isOpen, elements, withBackground, canvasBg, isDark]);

  if (!isOpen) return null;

  const exportBg = withBackground ? (isDark ? '#121212' : canvasBg) : 'transparent';

  const handleDownload = async () => {
    if (format === 'png') {
      await downloadPng(elements, title, {
        scale,
        withBackground,
        backgroundColor: exportBg,
        padding: 30,
      });
    } else {
      downloadSvg(elements, title, {
        scale,
        withBackground,
        backgroundColor: exportBg,
        padding: 30,
      });
    }
    onClose();
  };

  const handleCopyClipboard = async () => {
    const success = await copyPngToClipboard(elements, {
      scale,
      withBackground,
      backgroundColor: exportBg,
      padding: 30,
    });
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-dialog overflow-hidden flex flex-col transition-all ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-sm">Export Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Live Preview Container */}
          <div
            ref={previewContainerRef}
            className={`min-h-[140px] flex items-center justify-center p-3 rounded-xl border overflow-hidden ${
              isDark ? 'bg-[#18181c] border-[#34343e]' : 'bg-gray-50 border-gray-200'
            }`}
          />

          {/* Format Selection */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-medium transition-colors ${
                  format === 'png'
                    ? isDark
                      ? 'bg-[#3b387e] border-indigo-500 text-[#a5b4fc]'
                      : 'bg-[#e0dfff] border-indigo-400 text-[#5551c9]'
                    : isDark
                    ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>PNG (Bitmap)</span>
              </button>
              <button
                onClick={() => setFormat('svg')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-medium transition-colors ${
                  format === 'svg'
                    ? isDark
                      ? 'bg-[#3b387e] border-indigo-500 text-[#a5b4fc]'
                      : 'bg-[#e0dfff] border-indigo-400 text-[#5551c9]'
                    : isDark
                    ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>SVG (Vector)</span>
              </button>
            </div>
          </div>

          {/* Scale Factor (Only applicable for PNG) */}
          {format === 'png' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Scale Factor (Resolution)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`py-1.5 px-3 rounded-lg border font-medium text-center transition-colors ${
                      scale === s
                        ? isDark
                          ? 'bg-[#3b387e] border-indigo-500 text-[#a5b4fc]'
                          : 'bg-[#e0dfff] border-indigo-400 text-[#5551c9]'
                        : isDark
                        ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-300'
                        : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {s}x {s === 1 ? '(Standard)' : s === 2 ? '(Crisp/Retina)' : '(Ultra)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options Toggles */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={withBackground}
                onChange={(e) => setWithBackground(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <span className="font-medium text-xs">Include canvas background color</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1f1f25]">
          {format === 'png' ? (
            <button
              onClick={handleCopyClipboard}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border font-medium text-xs transition-colors ${
                isDark
                  ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-200'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
