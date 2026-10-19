import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { CanvasElement } from '../types/canvas';

interface FindModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  onFocusElement: (element: CanvasElement) => void;
  isDark: boolean;
}

export const FindModal: React.FC<FindModalProps> = ({
  isOpen,
  onClose,
  elements,
  onFocusElement,
  isDark,
}) => {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matchedElements = elements.filter((el) => {
    if (el.isDeleted || !query.trim()) return false;
    const q = query.trim().toLowerCase();

    // Match text content
    if (el.type === 'text' && el.text && el.text.toLowerCase().includes(q)) {
      return true;
    }

    // Match element type (e.g. "diamond", "arrow", "rectangle")
    if (el.type.toLowerCase().includes(q)) {
      return true;
    }

    return false;
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCurrentIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentIndex(0);
    if (matchedElements.length > 0) {
      onFocusElement(matchedElements[0]);
    }
  }, [query]);

  const handleNext = () => {
    if (matchedElements.length === 0) return;
    const next = (currentIndex + 1) % matchedElements.length;
    setCurrentIndex(next);
    onFocusElement(matchedElements[next]);
  };

  const handlePrev = () => {
    if (matchedElements.length === 0) return;
    const prev = (currentIndex - 1 + matchedElements.length) % matchedElements.length;
    setCurrentIndex(prev);
    onFocusElement(matchedElements[prev]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-40 animate-fade-in pointer-events-auto">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-dialog transition-all text-xs ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Find text or shape..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-44 bg-transparent focus:outline-none placeholder-gray-400"
        />

        {query.trim() && (
          <span className="text-[11px] font-mono text-gray-400 shrink-0 px-1">
            {matchedElements.length > 0
              ? `${currentIndex + 1} / ${matchedElements.length}`
              : '0 / 0'}
          </span>
        )}

        <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-gray-700 pl-1">
          <button
            onClick={handlePrev}
            disabled={matchedElements.length === 0}
            title="Previous match (Shift+Enter)"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] disabled:opacity-40"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            disabled={matchedElements.length === 0}
            title="Next match (Enter)"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] disabled:opacity-40"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
