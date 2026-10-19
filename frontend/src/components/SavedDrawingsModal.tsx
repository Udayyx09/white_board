import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { drawingService } from '../services/drawingService';
import { DrawingDetail, DrawingSummary } from '../types/api';

interface SavedDrawingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrawing: (drawing: DrawingDetail) => void;
  onNewDrawing: () => void;
  isDark: boolean;
}

export const SavedDrawingsModal: React.FC<SavedDrawingsModalProps> = ({
  isOpen,
  onClose,
  onSelectDrawing,
  onNewDrawing,
  isDark,
}) => {
  const [drawings, setDrawings] = useState<DrawingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDrawings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await drawingService.getUserDrawings();
      setDrawings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load drawings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDrawings();
    }
  }, [isOpen]);

  const handleOpen = async (id: string) => {
    try {
      const detail = await drawingService.getDrawing(id);
      onSelectDrawing(detail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to open drawing');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this drawing?')) return;
    try {
      await drawingService.deleteDrawing(id);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete drawing');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-dialog overflow-hidden flex flex-col max-h-[85vh] transition-all ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-sm">My Saved Drawings</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewDrawing();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Drawing</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading your drawings...</span>
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2c2c36] flex items-center justify-center mx-auto text-gray-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium">No drawings saved yet</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Draw anything on the whiteboard and click "Save Cloud" to store it in your account!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {drawings.map((drawing) => {
                const date = new Date(drawing.updatedAt || drawing.createdAt).toLocaleDateString();
                return (
                  <div
                    key={drawing.id}
                    onClick={() => handleOpen(drawing.id)}
                    className={`group relative rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md ${
                      isDark
                        ? 'bg-[#1e1e24] border-[#34343e] hover:border-indigo-500/50'
                        : 'bg-gray-50/70 border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div
                      className={`w-full h-28 rounded-lg mb-2.5 overflow-hidden flex items-center justify-center border ${
                        isDark ? 'bg-[#16161a] border-[#2c2c36]' : 'bg-white border-gray-200'
                      }`}
                    >
                      {drawing.thumbnail ? (
                        <img
                          src={drawing.thumbnail}
                          alt={drawing.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FolderOpen className="w-8 h-8 text-gray-400 opacity-40" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-xs truncate group-hover:text-indigo-500 transition-colors">
                          {drawing.title || 'Untitled Drawing'}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{date}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, drawing.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                        title="Delete drawing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
