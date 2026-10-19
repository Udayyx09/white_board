import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasElement,
  ElementProperties,
  Tool,
  ViewportState,
} from './types/canvas';
import { useHistory } from './hooks/useHistory';
import { useCollaboration } from './hooks/useCollaboration';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesSidebar } from './components/PropertiesSidebar';
import { TopBar } from './components/TopBar';
import { ZoomControls } from './components/ZoomControls';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { FindModal } from './components/FindModal';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { SavedDrawingsModal } from './components/SavedDrawingsModal';
import { HelpModal } from './components/HelpModal';
import { CollabModal } from './components/CollabModal';
import { authService } from './services/authService';
import { drawingService } from './services/drawingService';
import {
  downloadExcalidrawFile,
  parseExcalidrawFile,
} from './utils/excalidrawFile';
import { exportToPngDataUrl } from './utils/export';
import { generateId, getElementBounds } from './utils/math';
import { User, DrawingDetail } from './types/api';
import {
  Download,
  FolderOpen,
  Save,
  Search,
  Trash2,
  Sun,
  Moon,
  RotateCcw,
  Copy,
  Undo2,
  Redo2,
  Maximize2,
  HelpCircle,
  Cloud,
  Users,
  Zap,
} from 'lucide-react';

const INITIAL_PROPERTIES: ElementProperties = {
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  roundness: 'round',
  opacity: 100,
  fontSize: 20,
  textAlign: 'left',
};

export const App: React.FC = () => {
  // Canvas Elements & Undo/Redo History
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const { pushState, undo, redo, canUndo, canRedo, resetHistory } =
    useHistory(elements);

  // Selected tool & Lock toggle
  const [currentTool, setTool] = useState<Tool>('select');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Selection
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Style Properties
  const [properties, setProperties] = useState<ElementProperties>(INITIAL_PROPERTIES);

  // Infinite Canvas Viewport (Scroll & Zoom)
  const [viewport, setViewport] = useState<ViewportState>({
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
  });

  // Canvas background & Theme
  const [canvasBg, setCanvasBg] = useState<string>('#ffffff');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('excalidraw_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Drawing Metadata & Cloud State
  const [title, setTitle] = useState<string>('Untitled Drawing');
  const [cloudDrawingId, setCloudDrawingId] = useState<string | null>(null);
  const [isCloudSaved, setIsCloudSaved] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    authService.getUser()
  );

  // Real-time Live Collaboration Room State
  const [collabRoomId, setCollabRoomId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavedDrawingsModalOpen, setIsSavedDrawingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  // Hidden file input for Ctrl+O
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming remote elements from collaborators
  const handleRemoteElements = useCallback(
    (remoteElements: CanvasElement[]) => {
      setElements(remoteElements);
      resetHistory(remoteElements);
    },
    [resetHistory]
  );

  // Collaboration Hook
  const {
    collaborators,
    remoteLaserTrails,
    connectionStatus,
    myColor,
    myUsername,
    broadcastCursor,
    broadcastElements,
    broadcastLaser,
  } = useCollaboration({
    roomId: collabRoomId,
    onRemoteElements: handleRemoteElements,
    currentUser,
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('excalidraw_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('excalidraw_theme', 'light');
    }
  }, [isDark]);

  // Sync state changes with history and broadcast to room
  const handleElementsChange = useCallback(
    (newElements: CanvasElement[], recordHistory = false) => {
      setElements(newElements);
      setIsCloudSaved(false);
      if (recordHistory) {
        pushState(newElements);
        if (collabRoomId) {
          broadcastElements(newElements);
        }
      }
    },
    [pushState, collabRoomId, broadcastElements]
  );

  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) {
      setElements(prev);
      setSelectedElementIds([]);
      setIsCloudSaved(false);
      if (collabRoomId) {
        broadcastElements(prev);
      }
    }
  }, [undo, collabRoomId, broadcastElements]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) {
      setElements(next);
      setSelectedElementIds([]);
      setIsCloudSaved(false);
      if (collabRoomId) {
        broadcastElements(next);
      }
    }
  }, [redo, collabRoomId, broadcastElements]);

  // Updating properties: updates both global defaults and currently selected elements
  const handlePropertiesChange = (updates: Partial<ElementProperties>) => {
    const updatedProps = { ...properties, ...updates };
    setProperties(updatedProps);

    if (selectedElementIds.length > 0) {
      const updatedElements = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            ...updates,
          };
        }
        return el;
      });
      handleElementsChange(updatedElements, true);
    }
  };

  // Duplicate Selected Elements
  const handleDuplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const newElements = [...elements];
    const newSelectedIds: string[] = [];

    elements.forEach((el) => {
      if (selectedElementIds.includes(el.id)) {
        const cloned: CanvasElement = {
          ...el,
          id: generateId(),
          x: el.x + 20,
          y: el.y + 20,
        };
        newElements.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });

    handleElementsChange(newElements, true);
    setSelectedElementIds(newSelectedIds);
  }, [elements, selectedElementIds, handleElementsChange]);

  // Delete Selected Elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const remaining = elements.filter((el) => !selectedElementIds.includes(el.id));
    handleElementsChange(remaining, true);
    setSelectedElementIds([]);
  }, [elements, selectedElementIds, handleElementsChange]);

  // Bring to Front
  const handleBringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const nonSelected = elements.filter((el) => !selectedElementIds.includes(el.id));
    const selected = elements.filter((el) => selectedElementIds.includes(el.id));
    handleElementsChange([...nonSelected, ...selected], true);
  }, [elements, selectedElementIds, handleElementsChange]);

  // Send to Back
  const handleSendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const nonSelected = elements.filter((el) => !selectedElementIds.includes(el.id));
    const selected = elements.filter((el) => selectedElementIds.includes(el.id));
    handleElementsChange([...selected, ...nonSelected], true);
  }, [elements, selectedElementIds, handleElementsChange]);

  // Select All
  const handleSelectAll = useCallback(() => {
    const activeIds = elements.filter((el) => !el.isDeleted).map((el) => el.id);
    setSelectedElementIds(activeIds);
  }, [elements]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (elements.length === 0) return;
    if (confirm('Are you sure you want to clear the entire canvas?')) {
      handleElementsChange([], true);
      setSelectedElementIds([]);
      setCloudDrawingId(null);
      setTitle('Untitled Drawing');
      setIsCloudSaved(false);
    }
  }, [elements, handleElementsChange]);

  // Reset Zoom to 100%
  const handleResetZoom = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(8, prev.zoom * 1.2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2),
    }));
  }, []);

  // Zoom to Fit elements
  const handleZoomToFit = useCallback(() => {
    const active = elements.filter((el) => !el.isDeleted);
    if (active.length === 0) {
      setViewport({ scrollX: 0, scrollY: 0, zoom: 1 });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    active.forEach((el) => {
      const b = getElementBounds(el);
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 80;

    const scaleX = (window.innerWidth - padding * 2) / Math.max(width, 100);
    const scaleY = (window.innerHeight - padding * 2) / Math.max(height, 100);
    const zoom = Math.min(Math.max(0.2, Math.min(scaleX, scaleY)), 2);

    const scrollX = (window.innerWidth - width * zoom) / 2 - minX * zoom;
    const scrollY = (window.innerHeight - height * zoom) / 2 - minY * zoom;

    setViewport({ scrollX, scrollY, zoom });
  }, [elements]);

  // Focus and Pan to a specific element (for Find feature)
  const handleFocusElement = useCallback(
    (element: CanvasElement) => {
      setSelectedElementIds([element.id]);
      const bounds = getElementBounds(element);
      const cx = bounds.minX + bounds.width / 2;
      const cy = bounds.minY + bounds.height / 2;

      const targetScrollX = window.innerWidth / 2 - cx * viewport.zoom;
      const targetScrollY = window.innerHeight / 2 - cy * viewport.zoom;

      setViewport((prev) => ({
        ...prev,
        scrollX: targetScrollX,
        scrollY: targetScrollY,
      }));
    },
    [viewport.zoom]
  );

  // File Save (.excalidraw)
  const handleSaveFile = useCallback(() => {
    downloadExcalidrawFile(elements, viewport, title, canvasBg);
  }, [elements, viewport, title, canvasBg]);

  // File Open (.excalidraw)
  const handleOpenFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcalidrawFile(file);
      handleElementsChange(data.elements, true);
      resetHistory(data.elements);
      setSelectedElementIds([]);
      setTitle(file.name.replace(/\.excalidraw$/, '').replace(/\.json$/, ''));

      if (data.appState) {
        if (data.appState.viewBackgroundColor) {
          setCanvasBg(data.appState.viewBackgroundColor);
        }
        if (data.appState.zoom) {
          const z =
            typeof data.appState.zoom === 'number'
              ? data.appState.zoom
              : data.appState.zoom.value;
          setViewport((prev) => ({
            ...prev,
            zoom: z || 1,
            scrollX: data.appState?.scrollX || 0,
            scrollY: data.appState?.scrollY || 0,
          }));
        }
      }
    } catch (err: any) {
      alert(`Error loading file: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save to Cloud (Spring Boot Backend API)
  const handleSaveToCloud = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSavingCloud(true);
    try {
      const thumb = exportToPngDataUrl(elements, {
        scale: 0.5,
        withBackground: true,
        backgroundColor: isDark ? '#121212' : canvasBg,
        padding: 10,
      });

      const elementsJson = JSON.stringify(elements);
      const appStateJson = JSON.stringify({
        viewport,
        canvasBg,
      });

      const saved = await drawingService.saveDrawing({
        id: cloudDrawingId || undefined,
        title,
        elementsJson,
        appStateJson,
        thumbnail: thumb || undefined,
      });

      setCloudDrawingId(saved.id);
      setIsCloudSaved(true);
    } catch (err: any) {
      alert(`Failed to save to cloud: ${err.message}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Load Drawing from Cloud
  const handleSelectCloudDrawing = (drawing: DrawingDetail) => {
    try {
      const parsedElements = JSON.parse(drawing.elementsJson);
      handleElementsChange(parsedElements, true);
      resetHistory(parsedElements);
      setSelectedElementIds([]);
      setTitle(drawing.title);
      setCloudDrawingId(drawing.id);
      setIsCloudSaved(true);

      if (drawing.appStateJson) {
        const appState = JSON.parse(drawing.appStateJson);
        if (appState.viewport) {
          setViewport(appState.viewport);
        }
        if (appState.canvasBg) {
          setCanvasBg(appState.canvasBg);
        }
      }
    } catch (err: any) {
      alert(`Failed to load cloud drawing: ${err.message}`);
    }
  };

  // Start & Stop Live Collaboration Session
  const handleStartCollabSession = () => {
    const newRoomId = `session-${Math.random().toString(36).substring(2, 9)}`;
    setCollabRoomId(newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
  };

  const handleStopCollabSession = () => {
    setCollabRoomId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Command Palette (Ctrl + /)
      if (isCtrlOrCmd && e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Find on Canvas (Ctrl + F)
      if (isCtrlOrCmd && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsFindModalOpen(true);
        return;
      }

      // Export Image (Ctrl + Shift + E)
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsExportModalOpen(true);
        return;
      }

      // Open File (Ctrl + O)
      if (isCtrlOrCmd && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFileClick();
        return;
      }

      // Save to File (Ctrl + S)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveFile();
        return;
      }

      // Select All (Ctrl + A)
      if (isCtrlOrCmd && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Duplicate (Ctrl + D)
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Undo (Ctrl + Z)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo (Ctrl + Y or Ctrl + Shift + Z)
      if (
        (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y')) ||
        (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Escape: deselect or close modals
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
        return;
      }

      // Reset zoom (Shift + 0)
      if (e.shiftKey && e.key === ')') {
        e.preventDefault();
        handleResetZoom();
        return;
      }

      // Help (?)
      if (e.key === '?') {
        e.preventDefault();
        setIsHelpModalOpen(true);
        return;
      }

      // Tool switching keys (when Ctrl/Cmd is not held)
      if (!isCtrlOrCmd && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case '1':
          case 'v':
            setTool('select');
            break;
          case '2':
          case 'h':
            setTool('pan');
            break;
          case '3':
          case 'r':
            setTool('rectangle');
            break;
          case '4':
          case 'd':
            setTool('diamond');
            break;
          case '5':
          case 'o':
            setTool('ellipse');
            break;
          case '6':
          case 'a':
            setTool('arrow');
            break;
          case '7':
          case 'l':
            setTool('line');
            break;
          case '8':
          case 'p':
            setTool('pencil');
            break;
          case '9':
          case 't':
            setTool('text');
            break;
          case '0':
          case 'e':
            setTool('eraser');
            break;
          case 'k':
            setTool('laser');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleOpenFileClick,
    handleSaveFile,
    handleSelectAll,
    handleDuplicateSelected,
    handleDeleteSelected,
    handleResetZoom,
  ]);

  // Command Palette Items
  const commandList: CommandItem[] = [
    {
      id: 'live-collab',
      label: collabRoomId ? 'Manage Live Collaboration...' : 'Start Live Collaboration Session...',
      icon: <Users className="w-4 h-4 text-emerald-500" />,
      category: 'Collaboration',
      action: () => setIsCollabModalOpen(true),
    },
    {
      id: 'tool-laser',
      label: 'Laser Pen (Pointer)',
      shortcut: 'K',
      icon: <Zap className="w-4 h-4 text-rose-500" />,
      category: 'Tools',
      action: () => setTool('laser'),
    },
    {
      id: 'export-image',
      label: 'Export image (PNG / SVG)...',
      shortcut: 'Ctrl+Shift+E',
      icon: <Download className="w-4 h-4 text-blue-500" />,
      category: 'File',
      action: () => setIsExportModalOpen(true),
    },
    {
      id: 'save-file',
      label: 'Save to .excalidraw file',
      shortcut: 'Ctrl+S',
      icon: <Save className="w-4 h-4 text-emerald-500" />,
      category: 'File',
      action: handleSaveFile,
    },
    {
      id: 'open-file',
      label: 'Open .excalidraw file...',
      shortcut: 'Ctrl+O',
      icon: <FolderOpen className="w-4 h-4 text-indigo-500" />,
      category: 'File',
      action: handleOpenFileClick,
    },
    {
      id: 'save-cloud',
      label: 'Save to Cloud',
      icon: <Cloud className="w-4 h-4 text-sky-500" />,
      category: 'Cloud',
      action: handleSaveToCloud,
    },
    {
      id: 'find-canvas',
      label: 'Find on canvas...',
      shortcut: 'Ctrl+F',
      icon: <Search className="w-4 h-4 text-amber-500" />,
      category: 'Navigation',
      action: () => setIsFindModalOpen(true),
    },
    {
      id: 'zoom-to-100',
      label: 'Reset Zoom to 100%',
      shortcut: 'Shift+0',
      icon: <RotateCcw className="w-4 h-4 text-gray-500" />,
      category: 'View',
      action: handleResetZoom,
    },
    {
      id: 'zoom-to-fit',
      label: 'Zoom to fit all content',
      icon: <Maximize2 className="w-4 h-4 text-gray-500" />,
      category: 'View',
      action: handleZoomToFit,
    },
    {
      id: 'toggle-theme',
      label: `Switch to ${isDark ? 'Light' : 'Dark'} mode`,
      icon: isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-400" />
      ),
      category: 'Preferences',
      action: () => setIsDark(!isDark),
    },
    {
      id: 'undo',
      label: 'Undo last change',
      shortcut: 'Ctrl+Z',
      icon: <Undo2 className="w-4 h-4 text-gray-500" />,
      category: 'Edit',
      action: handleUndo,
    },
    {
      id: 'redo',
      label: 'Redo change',
      shortcut: 'Ctrl+Y',
      icon: <Redo2 className="w-4 h-4 text-gray-500" />,
      category: 'Edit',
      action: handleRedo,
    },
    {
      id: 'duplicate',
      label: 'Duplicate selected elements',
      shortcut: 'Ctrl+D',
      icon: <Copy className="w-4 h-4 text-gray-500" />,
      category: 'Edit',
      action: handleDuplicateSelected,
    },
    {
      id: 'clear-canvas',
      label: 'Clear entire canvas',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      category: 'Canvas',
      action: handleClearCanvas,
    },
    {
      id: 'help',
      label: 'Help & Keyboard shortcuts',
      shortcut: '?',
      icon: <HelpCircle className="w-4 h-4 text-indigo-500" />,
      category: 'Help',
      action: () => setIsHelpModalOpen(true),
    },
  ];

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDark ? 'dark bg-[#121212]' : 'bg-white'}`}>
      {/* Hidden file input for file open */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".excalidraw,.json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Header / Bar */}
      <TopBar
        title={title}
        onTitleChange={(newTitle) => {
          setTitle(newTitle);
          setIsCloudSaved(false);
        }}
        onOpenFile={handleOpenFileClick}
        onSaveFile={handleSaveFile}
        onExport={() => setIsExportModalOpen(true)}
        onFind={() => setIsFindModalOpen(true)}
        onCommandPalette={() => setIsCommandPaletteOpen(true)}
        onClearCanvas={handleClearCanvas}
        canvasBg={canvasBg}
        onCanvasBgChange={(color) => setCanvasBg(color)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
        }}
        onOpenSavedDrawings={() => setIsSavedDrawingsModalOpen(true)}
        onSaveToCloud={handleSaveToCloud}
        isCloudSaved={isCloudSaved}
        isSavingCloud={isSavingCloud}
        onOpenCollab={() => setIsCollabModalOpen(true)}
        collaboratorCount={collaborators.length + 1}
        isCollabActive={!!collabRoomId}
      />

      {/* Top Floating Island Toolbar */}
      <Toolbar
        currentTool={currentTool}
        setTool={setTool}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        isDark={isDark}
      />

      {/* Left Properties Sidebar (shows when tool is a shape or element is selected) */}
      {(selectedElementIds.length > 0 ||
        [
          'rectangle',
          'diamond',
          'ellipse',
          'arrow',
          'line',
          'pencil',
          'text',
        ].includes(currentTool)) && (
        <PropertiesSidebar
          properties={properties}
          onChange={handlePropertiesChange}
          onDuplicate={handleDuplicateSelected}
          onDelete={handleDeleteSelected}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          hasSelection={selectedElementIds.length > 0}
          isDark={isDark}
        />
      )}

      {/* The Infinite Canvas */}
      <Canvas
        elements={elements}
        onElementsChange={handleElementsChange}
        selectedElementIds={selectedElementIds}
        onSelectElements={setSelectedElementIds}
        currentTool={currentTool}
        setTool={setTool}
        isLocked={isLocked}
        properties={properties}
        viewport={viewport}
        onViewportChange={setViewport}
        canvasBg={canvasBg}
        isDark={isDark}
        collaborators={collaborators}
        remoteLaserTrails={remoteLaserTrails}
        onCursorMove={broadcastCursor}
        onBroadcastLaser={broadcastLaser}
        myColor={myColor}
      />

      {/* Bottom-left Zoom & History Controls */}
      <ZoomControls
        zoom={viewport.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isDark={isDark}
      />

      {/* Live Collaboration Modal */}
      <CollabModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        roomId={collabRoomId}
        onStartSession={handleStartCollabSession}
        onStopSession={handleStopCollabSession}
        collaborators={collaborators}
        connectionStatus={connectionStatus}
        myColor={myColor}
        myUsername={myUsername}
        isDark={isDark}
      />

      {/* Command Palette Modal (Ctrl+/) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandList}
        isDark={isDark}
      />

      {/* Find on Canvas Modal (Ctrl+F) */}
      <FindModal
        isOpen={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
        elements={elements}
        onFocusElement={handleFocusElement}
        isDark={isDark}
      />

      {/* Export Modal (Ctrl+Shift+E) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={elements}
        canvasBg={canvasBg}
        title={title}
        isDark={isDark}
      />

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
        isDark={isDark}
      />

      {/* My Saved Drawings Modal */}
      <SavedDrawingsModal
        isOpen={isSavedDrawingsModalOpen}
        onClose={() => setIsSavedDrawingsModalOpen(false)}
        onSelectDrawing={handleSelectCloudDrawing}
        onNewDrawing={() => {
          handleElementsChange([], true);
          setSelectedElementIds([]);
          setCloudDrawingId(null);
          setTitle('Untitled Drawing');
          setIsCloudSaved(false);
        }}
        isDark={isDark}
      />

      {/* Help Modal (?) */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};

export default App;
