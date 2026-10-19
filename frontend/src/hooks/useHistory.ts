import { useCallback, useState } from 'react';
import { CanvasElement } from '../types/canvas';

export function useHistory(initialState: CanvasElement[] = [], maxDepth = 50) {
  const [history, setHistory] = useState<CanvasElement[][]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushState = useCallback(
    (newState: CanvasElement[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        if (next.length >= maxDepth) {
          next.shift();
        }
        return [...next, newState];
      });
      setHistoryIndex((prev) => Math.min(prev + 1, maxDepth - 1));
    },
    [historyIndex, maxDepth]
  );

  const undo = useCallback((): CanvasElement[] | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback((): CanvasElement[] | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const resetHistory = useCallback((state: CanvasElement[]) => {
    setHistory([state]);
    setHistoryIndex(0);
  }, []);

  return {
    currentState: history[historyIndex] || [],
    pushState,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    resetHistory,
  };
}
