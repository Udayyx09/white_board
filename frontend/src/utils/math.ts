import { CanvasElement, Point, ResizeHandle, ViewportState } from '../types/canvas';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function screenToCanvas(screenX: number, screenY: number, viewport: ViewportState): Point {
  return {
    x: (screenX - viewport.scrollX) / viewport.zoom,
    y: (screenY - viewport.scrollY) / viewport.zoom,
  };
}

export function canvasToScreen(canvasX: number, canvasY: number, viewport: ViewportState): Point {
  return {
    x: canvasX * viewport.zoom + viewport.scrollX,
    y: canvasY * viewport.zoom + viewport.scrollY,
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function pointToLineDistance(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };
  return distance(p, projection);
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getElementBounds(element: CanvasElement): Bounds {
  if (element.type === 'pencil' && element.points && element.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    element.points.forEach((pt) => {
      minX = Math.min(minX, element.x + pt.x);
      minY = Math.min(minY, element.y + pt.y);
      maxX = Math.max(maxX, element.x + pt.x);
      maxY = Math.max(maxY, element.y + pt.y);
    });

    const pad = Math.max(4, element.strokeWidth * 2);
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: Math.max(10, maxX - minX + pad * 2),
      height: Math.max(10, maxY - minY + pad * 2),
    };
  }

  const minX = Math.min(element.x, element.x + element.width);
  const maxX = Math.max(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const maxY = Math.max(element.y, element.y + element.height);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

export function getElementsBounds(elements: CanvasElement[]): Bounds | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInElement(point: Point, element: CanvasElement, threshold = 8): boolean {
  if (element.isDeleted) return false;

  const bounds = getElementBounds(element);

  // Quick bounding box check with padding
  if (
    point.x < bounds.minX - threshold ||
    point.x > bounds.maxX + threshold ||
    point.y < bounds.minY - threshold ||
    point.y > bounds.maxY + threshold
  ) {
    return false;
  }

  switch (element.type) {
    case 'rectangle':
    case 'text':
      return (
        point.x >= bounds.minX &&
        point.x <= bounds.maxX &&
        point.y >= bounds.minY &&
        point.y <= bounds.maxY
      );

    case 'diamond': {
      // Check inside diamond (rhombus)
      const cx = bounds.minX + bounds.width / 2;
      const cy = bounds.minY + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      if (rx === 0 || ry === 0) return false;
      const dx = Math.abs(point.x - cx) / rx;
      const dy = Math.abs(point.y - cy) / ry;
      return dx + dy <= 1.05;
    }

    case 'ellipse': {
      const cx = bounds.minX + bounds.width / 2;
      const cy = bounds.minY + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      if (rx === 0 || ry === 0) return false;
      const norm = ((point.x - cx) / rx) ** 2 + ((point.y - cy) / ry) ** 2;
      return norm <= 1.05;
    }

    case 'line':
    case 'arrow': {
      const p1 = { x: element.x, y: element.y };
      const p2 = { x: element.x + element.width, y: element.y + element.height };
      return pointToLineDistance(point, p1, p2) <= threshold + element.strokeWidth / 2;
    }

    case 'pencil': {
      if (!element.points || element.points.length === 0) return false;
      for (let i = 0; i < element.points.length - 1; i++) {
        const p1 = { x: element.x + element.points[i].x, y: element.y + element.points[i].y };
        const p2 = { x: element.x + element.points[i + 1].x, y: element.y + element.points[i + 1].y };
        if (pointToLineDistance(point, p1, p2) <= threshold + element.strokeWidth) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

export function isElementInBox(element: CanvasElement, box: Bounds): boolean {
  const b = getElementBounds(element);
  return (
    b.minX >= box.minX &&
    b.maxX <= box.maxX &&
    b.minY >= box.minY &&
    b.maxY <= box.maxY
  );
}

export function getHandleCoordinates(bounds: Bounds): Record<string, Point> {
  const { minX, minY, maxX, maxY } = bounds;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return {
    nw: { x: minX, y: minY },
    n: { x: midX, y: minY },
    ne: { x: maxX, y: minY },
    e: { x: maxX, y: midY },
    se: { x: maxX, y: maxY },
    s: { x: midX, y: maxY },
    sw: { x: minX, y: maxY },
    w: { x: minX, y: midY },
    rotation: { x: midX, y: minY - 24 },
  };
}

export function getHandleAtPosition(
  point: Point,
  bounds: Bounds,
  zoom: number,
  handleSize = 8
): ResizeHandle {
  const coords = getHandleCoordinates(bounds);
  const size = handleSize / zoom;

  for (const [handle, pos] of Object.entries(coords)) {
    if (
      point.x >= pos.x - size &&
      point.x <= pos.x + size &&
      point.y >= pos.y - size &&
      point.y <= pos.y + size
    ) {
      return handle as ResizeHandle;
    }
  }

  return null;
}

export function getHandleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'rotation':
      return 'grab';
    default:
      return 'default';
  }
}

export function normalizeElement(element: CanvasElement): CanvasElement {
  if (element.type === 'line' || element.type === 'arrow' || element.type === 'pencil') {
    return element;
  }

  let { x, y, width, height } = element;
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  return {
    ...element,
    x,
    y,
    width,
    height,
  };
}
