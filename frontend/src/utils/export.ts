import rough from 'roughjs';
import { CanvasElement } from '../types/canvas';
import { getElementsBounds } from './math';
import { renderElement } from './roughRenderer';

export interface ExportOptions {
  scale: number; // 1, 2, 3
  withBackground: boolean;
  backgroundColor: string;
  padding: number;
}

export function exportToCanvas(
  elements: CanvasElement[],
  options: ExportOptions
): HTMLCanvasElement | null {
  const activeElements = elements.filter((el) => !el.isDeleted);
  if (activeElements.length === 0) return null;

  const bounds = getElementsBounds(activeElements);
  if (!bounds) return null;

  const padding = options.padding ?? 30;
  const width = (bounds.width + padding * 2) * options.scale;
  const height = (bounds.height + padding * 2) * options.scale;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(10, width);
  canvas.height = Math.max(10, height);

  const context = canvas.getContext('2d');
  if (!context) return null;

  if (options.withBackground) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.save();
  context.scale(options.scale, options.scale);
  context.translate(-bounds.minX + padding, -bounds.minY + padding);

  const rc = rough.canvas(canvas);
  activeElements.forEach((el) => {
    renderElement(rc, context, el);
  });

  context.restore();
  return canvas;
}

export function exportToPngDataUrl(
  elements: CanvasElement[],
  options: ExportOptions
): string | null {
  const canvas = exportToCanvas(elements, options);
  if (!canvas) return null;
  return canvas.toDataURL('image/png');
}

export async function downloadPng(
  elements: CanvasElement[],
  title: string,
  options: ExportOptions
): Promise<boolean> {
  const canvas = exportToCanvas(elements, options);
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitized = title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'drawing';
      a.download = `${sanitized}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve(true);
    }, 'image/png');
  });
}

export async function copyPngToClipboard(
  elements: CanvasElement[],
  options: ExportOptions
): Promise<boolean> {
  const canvas = exportToCanvas(elements, options);
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        resolve(true);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
        resolve(false);
      }
    }, 'image/png');
  });
}

export function exportToSvgString(
  elements: CanvasElement[],
  options: ExportOptions
): string | null {
  const activeElements = elements.filter((el) => !el.isDeleted);
  if (activeElements.length === 0) return null;

  const bounds = getElementsBounds(activeElements);
  if (!bounds) return null;

  const padding = options.padding ?? 30;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', `${width}`);
  svg.setAttribute('height', `${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  if (options.withBackground) {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', `${width}`);
    bgRect.setAttribute('height', `${height}`);
    bgRect.setAttribute('fill', options.backgroundColor);
    svg.appendChild(bgRect);
  }

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute(
    'transform',
    `translate(${-bounds.minX + padding}, ${-bounds.minY + padding})`
  );
  svg.appendChild(g);

  const rc = rough.svg(svg);

  activeElements.forEach((el) => {
    const opts = {
      stroke: el.strokeColor,
      strokeWidth: el.strokeWidth,
      roughness: el.roughness,
      fill: el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined,
      fillStyle: el.fillStyle === 'none' ? undefined : (el.fillStyle as any),
    };

    let node: SVGElement | null = null;
    switch (el.type) {
      case 'rectangle':
        node = rc.rectangle(el.x, el.y, el.width, el.height, opts);
        break;
      case 'diamond':
        node = rc.polygon([
          [el.x + el.width / 2, el.y],
          [el.x + el.width, el.y + el.height / 2],
          [el.x + el.width / 2, el.y + el.height],
          [el.x, el.y + el.height / 2],
        ], opts);
        break;
      case 'ellipse':
        node = rc.ellipse(
          el.x + el.width / 2,
          el.y + el.height / 2,
          Math.abs(el.width),
          Math.abs(el.height),
          opts
        );
        break;
      case 'line':
      case 'arrow':
        node = rc.line(el.x, el.y, el.x + el.width, el.y + el.height, opts);
        break;
      case 'pencil':
        if (el.points && el.points.length > 1) {
          node = rc.linearPath(el.points.map((p) => [el.x + p.x, el.y + p.y]), opts);
        }
        break;
      case 'text':
        if (el.text) {
          const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textNode.setAttribute('x', `${el.x}`);
          textNode.setAttribute('y', `${el.y + (el.fontSize || 20)}`);
          textNode.setAttribute('fill', el.strokeColor);
          textNode.setAttribute('font-size', `${el.fontSize || 20}px`);
          textNode.setAttribute('font-family', 'Virgil, sans-serif');
          textNode.textContent = el.text;
          node = textNode;
        }
        break;
    }

    if (node) {
      if (el.opacity < 100) {
        node.setAttribute('opacity', `${el.opacity / 100}`);
      }
      g.appendChild(node);
    }
  });

  return new XMLSerializer().serializeToString(svg);
}

export function downloadSvg(
  elements: CanvasElement[],
  title: string,
  options: ExportOptions
) {
  const svgString = exportToSvgString(elements, options);
  if (!svgString) return;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitized = title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'drawing';
  a.download = `${sanitized}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
