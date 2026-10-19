import React, { useRef, useEffect, useState, useCallback } from 'react';
import rough from 'roughjs';
import {
  CanvasElement,
  Collaborator,
  ElementProperties,
  LaserPoint,
  LaserTrail,
  Point,
  ResizeHandle,
  Tool,
  ViewportState,
  ActionState,
} from '../types/canvas';
import {
  canvasToScreen,
  generateId,
  getElementsBounds,
  getHandleAtPosition,
  getHandleCursor,
  isElementInBox,
  isPointInElement,
  normalizeElement,
  screenToCanvas,
} from '../utils/math';
import {
  renderCanvasGrid,
  renderElement,
  renderMarquee,
  renderSelectionBounds,
} from '../utils/roughRenderer';

interface CanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[], recordHistory?: boolean) => void;
  selectedElementIds: string[];
  onSelectElements: (ids: string[]) => void;
  currentTool: Tool;
  setTool: (tool: Tool) => void;
  isLocked: boolean;
  properties: ElementProperties;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  canvasBg: string;
  isDark: boolean;
  collaborators?: Collaborator[];
  remoteLaserTrails?: LaserTrail[];
  onCursorMove?: (x: number, y: number) => void;
  onBroadcastLaser?: (points: LaserPoint[]) => void;
  myColor?: string;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  onElementsChange,
  selectedElementIds,
  onSelectElements,
  currentTool,
  setTool,
  isLocked,
  properties,
  viewport,
  onViewportChange,
  canvasBg,
  isDark,
  collaborators = [],
  remoteLaserTrails = [],
  onCursorMove,
  onBroadcastLaser,
  myColor = '#ff2a5f',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction state
  const [action, setAction] = useState<ActionState>('none');
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState<Point>({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [cursor, setCursor] = useState<string>('default');

  // Working / temporary element during drawing
  const [workingElement, setWorkingElement] = useState<CanvasElement | null>(null);

  // Marquee selection box
  const [marqueeBox, setMarqueeBox] = useState<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } | null>(null);

  // In-place text editor state
  const [textEditor, setTextEditor] = useState<{
    elementId?: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    strokeColor: string;
  } | null>(null);

  // Laser Pointer Trail state
  const [localLaserPoints, setLocalLaserPoints] = useState<LaserPoint[]>([]);

  // Spacebar panning toggle
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Selected elements array
  const selectedElements = elements.filter(
    (el) => selectedElementIds.includes(el.id) && !el.isDeleted
  );

  // Resize canvas to full window
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Laser Pointer Trail Cleanup Animation Loop
  useEffect(() => {
    const hasLaser =
      localLaserPoints.length > 0 ||
      remoteLaserTrails.some((t) => t.points.length > 0);

    if (!hasLaser) return;

    let animId: number;
    const tick = () => {
      const now = Date.now();
      setLocalLaserPoints((prev) => prev.filter((p) => now - p.time < 1200));
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [localLaserPoints.length, remoteLaserTrails]);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear background
    ctx.save();
    ctx.fillStyle = isDark ? '#121212' : canvasBg;
    ctx.fillRect(0, 0, width, height);

    // Apply viewport transformation (smooth infinite pan & zoom)
    ctx.setTransform(
      (window.devicePixelRatio || 1) * viewport.zoom,
      0,
      0,
      (window.devicePixelRatio || 1) * viewport.zoom,
      (window.devicePixelRatio || 1) * viewport.scrollX,
      (window.devicePixelRatio || 1) * viewport.scrollY
    );

    // Render Grid
    renderCanvasGrid(ctx, viewport, width, height, isDark);

    // Render all elements using Rough.js
    const rc = rough.canvas(canvas);
    elements.forEach((el) => {
      if (textEditor?.elementId === el.id) return;
      renderElement(rc, ctx, el);
    });

    // Render temporary working element while drawing
    if (workingElement) {
      renderElement(rc, ctx, workingElement);
    }

    // Render selection bounding box and handles
    if (selectedElements.length > 0 && action !== 'drawing' && !textEditor) {
      renderSelectionBounds(ctx, selectedElements, viewport.zoom, isDark);
    }

    // Render selection marquee box
    if (marqueeBox) {
      renderMarquee(ctx, marqueeBox, viewport.zoom, isDark);
    }

    // Render Laser Trails (Local + Remote)
    const allLaserTrails: LaserTrail[] = [
      ...(localLaserPoints.length > 0
        ? [{ userId: 'me', color: myColor, points: localLaserPoints }]
        : []),
      ...remoteLaserTrails,
    ];

    if (allLaserTrails.length > 0) {
      renderLaserTrails(ctx, allLaserTrails, viewport.zoom);
    }

    // Render Remote Collaborator Cursors
    if (collaborators.length > 0) {
      renderCollaboratorCursors(ctx, collaborators, viewport.zoom);
    }

    ctx.restore();
  }, [
    elements,
    workingElement,
    selectedElements,
    viewport,
    canvasBg,
    isDark,
    marqueeBox,
    action,
    textEditor,
    localLaserPoints,
    remoteLaserTrails,
    collaborators,
    myColor,
  ]);

  // Space key detection for quick panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Commit text editing
  const commitTextEditor = () => {
    if (!textEditor) return;

    const trimmed = textEditor.text.trim();
    if (trimmed) {
      if (textEditor.elementId) {
        const updated = elements.map((el) => {
          if (el.id === textEditor.elementId) {
            return {
              ...el,
              text: textEditor.text,
            };
          }
          return el;
        });
        onElementsChange(updated, true);
      } else {
        const newEl: CanvasElement = {
          id: generateId(),
          type: 'text',
          x: textEditor.x,
          y: textEditor.y,
          width: 150,
          height: 30,
          strokeColor: textEditor.strokeColor,
          backgroundColor: 'transparent',
          fillStyle: 'none',
          strokeWidth: properties.strokeWidth,
          strokeStyle: 'solid',
          roughness: properties.roughness,
          opacity: properties.opacity,
          angle: 0,
          text: textEditor.text,
          fontSize: textEditor.fontSize,
          fontFamily: textEditor.fontFamily,
          textAlign: properties.textAlign,
        };
        onElementsChange([...elements, newEl], true);
        onSelectElements([newEl.id]);
      }
    } else if (textEditor.elementId) {
      onElementsChange(
        elements.filter((el) => el.id !== textEditor.elementId),
        true
      );
      onSelectElements([]);
    }

    setTextEditor(null);
    if (!isLocked) {
      setTool('select');
    }
  };

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;

    const screenPos = { x: e.clientX, y: e.clientY };
    const canvasPos = screenToCanvas(screenPos.x, screenPos.y, viewport);

    setStartPoint(canvasPos);
    setCurrentPoint(canvasPos);

    if (textEditor) {
      commitTextEditor();
      return;
    }

    // Middle click or Space held -> Pan
    if (e.button === 1 || isSpacePressed || currentTool === 'pan') {
      setAction('panning');
      setCursor('grabbing');
      return;
    }

    // Laser Pen Tool
    if (currentTool === 'laser') {
      setAction('laser');
      const point: LaserPoint = {
        x: canvasPos.x,
        y: canvasPos.y,
        time: Date.now(),
      };
      const newPoints = [point];
      setLocalLaserPoints(newPoints);
      if (onBroadcastLaser) {
        onBroadcastLaser(newPoints);
      }
      return;
    }

    // Eraser Tool
    if (currentTool === 'eraser') {
      setAction('erasing');
      const hit = elements.find((el) => isPointInElement(canvasPos, el));
      if (hit) {
        onElementsChange(
          elements.filter((el) => el.id !== hit.id),
          true
        );
      }
      return;
    }

    // Selection Tool
    if (currentTool === 'select') {
      if (selectedElements.length > 0) {
        const bounds = getElementsBounds(selectedElements);
        if (bounds) {
          const handle = getHandleAtPosition(canvasPos, bounds, viewport.zoom);
          if (handle) {
            setAction('resizing');
            setActiveHandle(handle);
            setCursor(getHandleCursor(handle));
            return;
          }
        }
      }

      const hitElement = [...elements]
        .reverse()
        .find((el) => isPointInElement(canvasPos, el));

      if (hitElement) {
        if (e.shiftKey) {
          if (selectedElementIds.includes(hitElement.id)) {
            onSelectElements(selectedElementIds.filter((id) => id !== hitElement.id));
          } else {
            onSelectElements([...selectedElementIds, hitElement.id]);
          }
        } else {
          if (!selectedElementIds.includes(hitElement.id)) {
            onSelectElements([hitElement.id]);
          }
        }
        setAction('moving');
        setCursor('move');
        return;
      }

      if (!e.shiftKey) {
        onSelectElements([]);
      }
      setAction('selecting');
      setMarqueeBox({
        minX: canvasPos.x,
        minY: canvasPos.y,
        maxX: canvasPos.x,
        maxY: canvasPos.y,
        width: 0,
        height: 0,
      });
      return;
    }

    // Text Tool
    if (currentTool === 'text') {
      setTextEditor({
        x: canvasPos.x,
        y: canvasPos.y,
        text: '',
        fontSize: properties.fontSize || 20,
        fontFamily: 'Virgil, sans-serif',
        strokeColor: properties.strokeColor,
      });
      return;
    }

    // Shapes Tool
    setAction('drawing');
    const newEl: CanvasElement = {
      id: generateId(),
      type: currentTool as any,
      x: canvasPos.x,
      y: canvasPos.y,
      width: 0,
      height: 0,
      strokeColor: properties.strokeColor,
      backgroundColor: properties.backgroundColor,
      fillStyle: properties.fillStyle,
      strokeWidth: properties.strokeWidth,
      strokeStyle: properties.strokeStyle,
      roughness: properties.roughness,
      roundness: properties.roundness,
      opacity: properties.opacity,
      angle: 0,
      points: currentTool === 'pencil' ? [{ x: 0, y: 0 }] : undefined,
    };
    setWorkingElement(newEl);
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPos = { x: e.clientX, y: e.clientY };
    const canvasPos = screenToCanvas(screenPos.x, screenPos.y, viewport);
    const prevCanvasPos = currentPoint;
    setCurrentPoint(canvasPos);

    // Broadcast cursor position to remote collaborators
    if (onCursorMove) {
      onCursorMove(canvasPos.x, canvasPos.y);
    }

    // Cursor Styling when idle
    if (action === 'none') {
      if (isSpacePressed || currentTool === 'pan') {
        setCursor('grab');
        return;
      }
      if (currentTool === 'laser') {
        setCursor('crosshair');
        return;
      }
      if (currentTool === 'eraser') {
        setCursor('crosshair');
        return;
      }
      if (currentTool === 'text') {
        setCursor('text');
        return;
      }
      if (currentTool !== 'select') {
        setCursor('crosshair');
        return;
      }

      if (selectedElements.length > 0) {
        const bounds = getElementsBounds(selectedElements);
        if (bounds) {
          const handle = getHandleAtPosition(canvasPos, bounds, viewport.zoom);
          if (handle) {
            setCursor(getHandleCursor(handle));
            return;
          }
        }
      }

      const hit = elements.find((el) => isPointInElement(canvasPos, el));
      if (hit) {
        setCursor('move');
      } else {
        setCursor('default');
      }
      return;
    }

    // 1. Panning Action
    if (action === 'panning') {
      const dx = (canvasPos.x - startPoint.x) * viewport.zoom;
      const dy = (canvasPos.y - startPoint.y) * viewport.zoom;
      onViewportChange({
        ...viewport,
        scrollX: viewport.scrollX + dx,
        scrollY: viewport.scrollY + dy,
      });
      return;
    }

    // 2. Laser Pen Action
    if (action === 'laser') {
      const point: LaserPoint = {
        x: canvasPos.x,
        y: canvasPos.y,
        time: Date.now(),
      };
      setLocalLaserPoints((prev) => {
        const updated = [...prev, point];
        if (onBroadcastLaser) {
          onBroadcastLaser(updated);
        }
        return updated;
      });
      return;
    }

    // 3. Erasing Action
    if (action === 'erasing') {
      const hit = elements.find((el) => isPointInElement(canvasPos, el));
      if (hit) {
        onElementsChange(
          elements.filter((el) => el.id !== hit.id),
          true
        );
      }
      return;
    }

    // 4. Moving Selected Elements
    if (action === 'moving') {
      const dx = canvasPos.x - prevCanvasPos.x;
      const dy = canvasPos.y - prevCanvasPos.y;

      const updated = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            x: el.x + dx,
            y: el.y + dy,
          };
        }
        return el;
      });
      onElementsChange(updated, false);
      return;
    }

    // 5. Resizing Elements
    if (action === 'resizing' && activeHandle && selectedElements.length > 0) {
      const dx = canvasPos.x - prevCanvasPos.x;
      const dy = canvasPos.y - prevCanvasPos.y;

      const updated = elements.map((el) => {
        if (!selectedElementIds.includes(el.id)) return el;

        let { x, y, width, height } = el;

        switch (activeHandle) {
          case 'se':
            width += dx;
            height += dy;
            break;
          case 'e':
            width += dx;
            break;
          case 's':
            height += dy;
            break;
          case 'nw':
            x += dx;
            y += dy;
            width -= dx;
            height -= dy;
            break;
          case 'w':
            x += dx;
            width -= dx;
            break;
          case 'n':
            y += dy;
            height -= dy;
            break;
          case 'ne':
            y += dy;
            width += dx;
            height -= dy;
            break;
          case 'sw':
            x += dx;
            width -= dx;
            height += dy;
            break;
        }

        return {
          ...el,
          x,
          y,
          width,
          height,
        };
      });

      onElementsChange(updated, false);
      return;
    }

    // 6. Marquee Selection Box
    if (action === 'selecting') {
      const minX = Math.min(startPoint.x, canvasPos.x);
      const maxX = Math.max(startPoint.x, canvasPos.x);
      const minY = Math.min(startPoint.y, canvasPos.y);
      const maxY = Math.max(startPoint.y, canvasPos.y);

      const box = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      };

      setMarqueeBox(box);

      const enclosedIds = elements
        .filter((el) => isElementInBox(el, box))
        .map((el) => el.id);

      onSelectElements(enclosedIds);
      return;
    }

    // 7. Drawing Shapes
    if (action === 'drawing' && workingElement) {
      if (workingElement.type === 'pencil') {
        const relPoint = {
          x: canvasPos.x - workingElement.x,
          y: canvasPos.y - workingElement.y,
        };
        setWorkingElement({
          ...workingElement,
          points: [...(workingElement.points || []), relPoint],
        });
      } else {
        let width = canvasPos.x - startPoint.x;
        let height = canvasPos.y - startPoint.y;

        if (e.shiftKey) {
          const side = Math.max(Math.abs(width), Math.abs(height));
          width = width < 0 ? -side : side;
          height = height < 0 ? -side : side;
        }

        setWorkingElement({
          ...workingElement,
          width,
          height,
        });
      }
    }
  };

  // Pointer Up Handler
  const handlePointerUp = () => {
    if (action === 'drawing' && workingElement) {
      const normalized = normalizeElement(workingElement);
      const hasSize =
        normalized.type === 'pencil'
          ? (normalized.points && normalized.points.length > 1)
          : Math.abs(normalized.width) > 3 || Math.abs(normalized.height) > 3;

      if (hasSize) {
        onElementsChange([...elements, normalized], true);
        onSelectElements([normalized.id]);
      }

      setWorkingElement(null);

      if (!isLocked) {
        setTool('select');
      }
    } else if (action === 'moving' || action === 'resizing') {
      onElementsChange(elements, true);
    }

    setAction('none');
    setActiveHandle(null);
    setMarqueeBox(null);
  };

  // Double Click Handler
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPos = { x: e.clientX, y: e.clientY };
    const canvasPos = screenToCanvas(screenPos.x, screenPos.y, viewport);

    const hit = [...elements]
      .reverse()
      .find((el) => isPointInElement(canvasPos, el));

    if (hit && hit.type === 'text') {
      setTextEditor({
        elementId: hit.id,
        x: hit.x,
        y: hit.y,
        text: hit.text || '',
        fontSize: hit.fontSize || 20,
        fontFamily: hit.fontFamily || 'Virgil, sans-serif',
        strokeColor: hit.strokeColor,
      });
    }
  };

  // Wheel Handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(0.1, viewport.zoom * zoomFactor), 8);

      const mouseCanvasX = (e.clientX - viewport.scrollX) / viewport.zoom;
      const mouseCanvasY = (e.clientY - viewport.scrollY) / viewport.zoom;

      const newScrollX = e.clientX - mouseCanvasX * newZoom;
      const newScrollY = e.clientY - mouseCanvasY * newZoom;

      onViewportChange({
        zoom: newZoom,
        scrollX: newScrollX,
        scrollY: newScrollY,
      });
    } else {
      onViewportChange({
        ...viewport,
        scrollX: viewport.scrollX - e.deltaX,
        scrollY: viewport.scrollY - e.deltaY,
      });
    }
  };

  const textEditorScreenPos = textEditor
    ? canvasToScreen(textEditor.x, textEditor.y, viewport)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className="block touch-none"
      />

      {/* Inline Text Editor */}
      {textEditor && textEditorScreenPos && (
        <div
          className="absolute z-40"
          style={{
            left: `${textEditorScreenPos.x}px`,
            top: `${textEditorScreenPos.y}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <textarea
            autoFocus
            value={textEditor.text}
            placeholder="Type anything..."
            onChange={(e) =>
              setTextEditor({ ...textEditor, text: e.target.value })
            }
            onBlur={commitTextEditor}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                commitTextEditor();
              }
            }}
            style={{
              fontSize: `${textEditor.fontSize * viewport.zoom}px`,
              fontFamily: textEditor.fontFamily,
              color: textEditor.strokeColor,
              lineHeight: 1.25,
            }}
            className="bg-transparent border border-dashed border-indigo-500 outline-none resize-none p-1 min-w-[120px] overflow-hidden whitespace-pre font-hand"
            rows={Math.max(1, textEditor.text.split('\n').length)}
          />
        </div>
      )}
    </div>
  );
};

// Render Laser Pen Trails with glowing fading particles
function renderLaserTrails(
  ctx: CanvasRenderingContext2D,
  trails: LaserTrail[],
  zoom: number
) {
  const now = Date.now();

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  trails.forEach((trail) => {
    const points = trail.points.filter((p) => now - p.time < 1200);
    if (points.length < 2) return;

    ctx.shadowColor = trail.color || '#ff2a5f';
    ctx.shadowBlur = 14 / zoom;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const age = now - p2.time;
      const progress = 1 - age / 1200; // 1 at head, 0 at tail
      if (progress <= 0) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = trail.color || '#ff2a5f';
      ctx.globalAlpha = Math.max(0.05, progress);
      ctx.lineWidth = Math.max(1, progress * 6 / zoom);
      ctx.stroke();
    }

    // Glowing head dot
    const head = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(head.x, head.y, 4 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 6 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = trail.color || '#ff2a5f';
    ctx.globalAlpha = 0.8;
    ctx.fill();
  });

  ctx.restore();
}

// Render Remote Collaborator Cursors and Name Badges
function renderCollaboratorCursors(
  ctx: CanvasRenderingContext2D,
  collaborators: Collaborator[],
  zoom: number
) {
  ctx.save();

  collaborators.forEach((c) => {
    if (!c.cursor) return;
    const { x, y } = c.cursor;

    // 1. Draw pointer arrow SVG-style path
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / zoom, 1 / zoom);

    ctx.fillStyle = c.color || '#6965db';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(4.5, 12);
    ctx.lineTo(10.5, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Draw name badge pill
    const name = c.username || 'Collaborator';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(name).width;
    const badgeX = 12;
    const badgeY = 12;
    const badgeW = textWidth + 12;
    const badgeH = 20;
    const radius = 6;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
    ctx.fillStyle = c.color || '#6965db';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, badgeX + 6, badgeY + badgeH / 2);

    ctx.restore();
  });

  ctx.restore();
}
