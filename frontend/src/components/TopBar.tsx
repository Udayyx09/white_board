import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  FolderOpen,
  Save,
  Download,
  Search,
  Terminal,
  Trash2,
  Sun,
  Moon,
  Cloud,
  CloudCheck,
  CloudUpload,
  User as UserIcon,
  LogOut,
  FolderKanban,
  Palette,
  Users,
} from 'lucide-react';
import { User } from '../types/api';

interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExport: () => void;
  onFind: () => void;
  onCommandPalette: () => void;
  onClearCanvas: () => void;
  canvasBg: string;
  onCanvasBgChange: (color: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSavedDrawings: () => void;
  onSaveToCloud: () => void;
  isCloudSaved: boolean;
  isSavingCloud: boolean;
  onOpenCollab: () => void;
  collaboratorCount: number;
  isCollabActive: boolean;
}

const CANVAS_COLORS = [
  '#ffffff',
  '#f8f9fa',
  '#f1f3f5',
  '#fff9db',
  '#e7f5ff',
  '#ebfbee',
  '#121212',
  '#1e1e24',
];

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onTitleChange,
  onOpenFile,
  onSaveFile,
  onExport,
  onFind,
  onCommandPalette,
  onClearCanvas,
  canvasBg,
  onCanvasBgChange,
  isDark,
  onToggleDark,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenSavedDrawings,
  onSaveToCloud,
  isCloudSaved,
  isSavingCloud,
  onOpenCollab,
  collaboratorCount,
  isCollabActive,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const commitTitle = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="fixed top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
      {/* Left side: Hamburger Menu & Title */}
      <div className="flex items-center gap-2 pointer-events-auto" ref={menuRef}>
        {/* Menu Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg border shadow-island transition-colors ${
              isDark
                ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0] hover:bg-[#2c2c36]'
                : 'bg-white border-[#e0e0e0] text-[#2c2c2c] hover:bg-gray-100'
            }`}
            title="Main Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Menu Dropdown */}
          {isMenuOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 rounded-xl border shadow-dialog p-2 transition-all text-xs font-sans ${
                isDark
                  ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
                  : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
              }`}
            >
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenFile();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-500" />
                    Open file...
                  </span>
                  <kbd className="text-[10px] text-gray-400 font-mono">Ctrl+O</kbd>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSaveFile();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-500" />
                    Save to file (.excalidraw)
                  </span>
                  <kbd className="text-[10px] text-gray-400 font-mono">Ctrl+S</kbd>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExport();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    Export image...
                  </span>
                  <kbd className="text-[10px] text-gray-400 font-mono">Ctrl+Shift+E</kbd>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onFind();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-500" />
                    Find on canvas
                  </span>
                  <kbd className="text-[10px] text-gray-400 font-mono">Ctrl+F</kbd>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCommandPalette();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-500" />
                    Command palette
                  </span>
                  <kbd className="text-[10px] text-gray-400 font-mono">Ctrl+/</kbd>
                </button>

                {currentUser && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSavedDrawings();
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-sky-500" />
                      My Cloud Drawings
                    </span>
                  </button>
                )}

                <div className="my-1.5 border-t border-gray-200 dark:border-gray-800" />

                {/* Canvas background color selector */}
                <div className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Canvas Background
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CANVAS_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => onCanvasBgChange(c)}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          canvasBg === c ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <div className="my-1.5 border-t border-gray-200 dark:border-gray-800" />

                {/* Dark mode toggle */}
                <button
                  onClick={() => {
                    onToggleDark();
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    Theme
                  </span>
                  <span className="text-gray-400 capitalize">{isDark ? 'Dark' : 'Light'}</span>
                </button>

                {/* Clear canvas */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onClearCanvas();
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset / Clear canvas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title input */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className={`px-2 py-1 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-[#2a2a34] border-[#444] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className={`px-2.5 py-1 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-[#2e2e38] transition-colors truncate max-w-[180px] sm:max-w-xs ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
              title="Click to rename"
            >
              {title || 'Untitled Drawing'}
            </button>
          )}
        </div>
      </div>

      {/* Right side: Collaboration, Cloud Sync, Auth, and Export */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Live Collaboration Button */}
        <button
          onClick={onOpenCollab}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-island transition-colors ${
            isCollabActive
              ? isDark
                ? 'bg-[#1e2a22] border-emerald-500/50 text-emerald-300 hover:bg-[#25352b]'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              : isDark
              ? 'bg-[#232329] border-[#34343e] hover:bg-[#2c2c36] text-gray-200'
              : 'bg-white border-[#e0e0e0] hover:bg-gray-50 text-gray-700'
          }`}
          title="Live Collaboration Session"
        >
          <Users className={`w-3.5 h-3.5 ${isCollabActive ? 'text-emerald-500 animate-pulse' : 'text-indigo-500'}`} />
          <span className="hidden sm:inline">
            {isCollabActive ? `Live (${collaboratorCount})` : 'Collaborate'}
          </span>
          {isCollabActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        {/* Save to Cloud Button */}
        {currentUser ? (
          <button
            onClick={onSaveToCloud}
            disabled={isSavingCloud}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-island transition-colors ${
              isSavingCloud
                ? 'opacity-70 cursor-wait'
                : isDark
                ? 'bg-[#232329] border-[#34343e] hover:bg-[#2c2c36] text-gray-200'
                : 'bg-white border-[#e0e0e0] hover:bg-gray-50 text-gray-700'
            }`}
            title={isCloudSaved ? 'Synced with cloud' : 'Click to save changes to cloud'}
          >
            {isSavingCloud ? (
              <CloudUpload className="w-3.5 h-3.5 animate-bounce text-indigo-500" />
            ) : isCloudSaved ? (
              <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden sm:inline">
              {isSavingCloud ? 'Saving...' : isCloudSaved ? 'Cloud Synced' : 'Save Cloud'}
            </span>
          </button>
        ) : null}

        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSavedDrawings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-island transition-colors ${
                isDark
                  ? 'bg-[#232329] border-[#34343e] hover:bg-[#2c2c36] text-gray-200'
                  : 'bg-white border-[#e0e0e0] hover:bg-gray-50 text-gray-700'
              }`}
              title="View your saved drawings"
            >
              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.username[0].toUpperCase()}
              </div>
              <span className="hidden md:inline">{currentUser.username}</span>
            </button>
            <button
              onClick={onLogout}
              className={`p-2 rounded-lg border shadow-island transition-colors ${
                isDark
                  ? 'bg-[#232329] border-[#34343e] hover:bg-red-950/40 text-gray-400 hover:text-red-400'
                  : 'bg-white border-[#e0e0e0] hover:bg-red-50 text-gray-500 hover:text-red-600'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-island transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Quick Export Button */}
        <button
          onClick={onExport}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-island transition-colors ${
            isDark
              ? 'bg-[#232329] border-[#34343e] hover:bg-[#2c2c36] text-gray-200'
              : 'bg-white border-[#e0e0e0] hover:bg-gray-50 text-gray-700'
          }`}
          title="Export image (Ctrl+Shift+E)"
        >
          <Download className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
