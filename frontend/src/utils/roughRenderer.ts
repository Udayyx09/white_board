import rough from 'roughjs';
import { Options } from 'roughjs/bin/core';
import { Bounds, getElementsBounds, getHandleCoordinates } from './math';
import { CanvasElement, Point, ViewportState } from '../types/canvas';

function getRoughOptions(element: CanvasElement): Options {
  const options: Options = {
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
    bowing: element.roughness === 0 ? 0 : 1.5,
    seed: 12345, // consistent seed for stable hand-drawn look
  };

  if (element.backgroundColor && element.backgroundColor !== 'transparent' && element.fillStyle !== 'none') {
    options.fill = element.backgroundColor;
    switch (element.fillStyle) {
      case 'solid':
        options.fillStyle = 'solid';
        break;
      case 'cross-hatch':
        options.fillStyle = 'cross-hatch';
        options.hachureGap = 5;
        options.hachureAngle = 60;
        break;
      case 'hachure':
      default:
        options.fillStyle = 'hachure';
        options.hachureGap = 6;
        options.hachureAngle = -41;
        break;
    }
  }

  if (element.strokeStyle === 'dashed') {
    options.strokeLineDash = [8, 8];
  } else if (element.strokeStyle === 'dotted') {
    options.strokeLineDash = [3, 4];
  }

  return options;
}

export function renderElement(
  rc: ReturnType<typeof rough.canvas>,
  context: CanvasRenderingContext2D,
  element: CanvasElement
) {
  if (element.isDeleted) return;

  context.save();
  context.globalAlpha = (element.opacity ?? 100) / 100;

  const options = getRoughOptions(element);

  switch (element.type) {
    case 'rectangle': {
      if (element.roundness === 'round') {
        // Draw rounded rectangle or polygon
        rc.rectangle(element.x, element.y, element.width, element.height, {
          ...options,
          // Roughjs supports curve/roughness
        });
      } else {
        rc.rectangle(element.x, element.y, element.width, element.height, options);
      }
      break;
    }

    case 'diamond': {
      const x = element.x;
      const y = element.y;
      const w = element.width;
      const h = element.height;
      const points: [number, number][] = [
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
        [x, y + h / 2],
      ];
      rc.polygon(points, options);
      break;
    }

    case 'ellipse': {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);
      rc.ellipse(cx, cy, w, h, options);
      break;
    }

    case 'line': {
      rc.line(
        element.x,
        element.y,
        element.x + element.width,
        element.y + element.height,
        options
      );
      break;
    }

    case 'arrow': {
      const x1 = element.x;
      const y1 = element.y;
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;

      // Draw main line
      rc.line(x1, y1, x2, y2, options);

      // Draw arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowLength = Math.max(12, element.strokeWidth * 5);
      const arrowAngle = Math.PI / 6;

      const leftX = x2 - arrowLength * Math.cos(angle - arrowAngle);
      const leftY = y2 - arrowLength * Math.sin(angle - arrowAngle);
      const rightX = x2 - arrowLength * Math.cos(angle + arrowAngle);
      const rightY = y2 - arrowLength * Math.sin(angle + arrowAngle);

      rc.line(x2, y2, leftX, leftY, options);
      rc.line(x2, y2, rightX, rightY, options);
      break;
    }

    case 'pencil': {
      if (!element.points || element.points.length < 2) break;
      const pts: [number, number][] = element.points.map((p) => [
        element.x + p.x,
        element.y + p.y,
      ]);
      rc.linearPath(pts, options);
      break;
    }

    case 'text': {
      if (!element.text) break;
      const fontSize = element.fontSize || 20;
      const fontFamily = element.fontFamily || 'Virgil, "Comic Sans MS", "Segoe Print", cursive, sans-serif';
      
      context.font = `${fontSize}px ${fontFamily}`;
      context.fillStyle = element.strokeColor;
      context.textBaseline = 'top';
      context.textAlign = (element.textAlign || 'left') as CanvasTextAlign;

      const lines = element.text.split('\n');
      const lineHeight = fontSize * 1.25;

      lines.forEach((line, index) => {
        let textX = element.x;
        if (element.textAlign === 'center') {
          textX = element.x + element.width / 2;
        } else if (element.textAlign === 'right') {
          textX = element.x + element.width;
        }
        context.fillText(line, textX, element.y + index * lineHeight);
      });
      break;
    }
  }

  context.restore();
}

export function renderSelectionBounds(
  context: CanvasRenderingContext2D,
  elements: CanvasElement[],
  zoom: number,
  isDark = false
) {
  if (elements.length === 0) return;

  const bounds = getElementsBounds(elements);
  if (!bounds) return;

  const pad = 6 / zoom;
  const minX = bounds.minX - pad;
  const minY = bounds.minY - pad;
  const width = bounds.width + pad * 2;
  const height = bounds.height + pad * 2;

  context.save();
  context.strokeStyle = isDark ? '#818cf8' : '#6965db';
  context.lineWidth = 1.5 / zoom;
  context.setLineDash([5 / zoom, 5 / zoom]);
  context.strokeRect(minX, minY, width, height);

  // Render 8 resize handles
  const handleSize = 8 / zoom;
  const halfSize = handleSize / 2;
  const coords = getHandleCoordinates({
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
  });

  context.setLineDash([]);
  context.fillStyle = isDark ? '#1e1e24' : '#ffffff';
  context.strokeStyle = isDark ? '#a5b4fc' : '#6965db';
  context.lineWidth = 1.5 / zoom;

  for (const [key, pt] of Object.entries(coords)) {
    if (key === 'rotation') continue; // only if single element rotation is supported
    context.fillRect(pt.x - halfSize, pt.y - halfSize, handleSize, handleSize);
    context.strokeRect(pt.x - halfSize, pt.y - halfSize, handleSize, handleSize);
  }

  context.restore();
}

export function renderMarquee(
  context: CanvasRenderingContext2D,
  box: Bounds,
  zoom: number,
  isDark = false
) {
  context.save();
  context.fillStyle = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(105, 101, 219, 0.12)';
  context.strokeStyle = isDark ? '#818cf8' : '#6965db';
  context.lineWidth = 1 / zoom;
  context.setLineDash([4 / zoom, 4 / zoom]);

  context.fillRect(box.minX, box.minY, box.width, box.height);
  context.strokeRect(box.minX, box.minY, box.width, box.height);
  context.restore();
}

export function renderCanvasGrid(
  context: CanvasRenderingContext2D,
  viewport: ViewportState,
  width: number,
  height: number,
  isDark = false
) {
  const gridSize = 20 * viewport.zoom;
  if (gridSize < 12) return; // don't render dense grid when zoomed far out

  context.save();
  context.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';

  const startX = (viewport.scrollX % gridSize) - gridSize;
  const startY = (viewport.scrollY % gridSize) - gridSize;

  for (let x = startX; x < width + gridSize; x += gridSize) {
    for (let y = startY; y < height + gridSize; y += gridSize) {
      context.beginPath();
      context.arc(x, y, 1, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}
