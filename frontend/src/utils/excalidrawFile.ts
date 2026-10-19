import { CanvasElement, ExcalidrawExportJson, ViewportState } from '../types/canvas';

export function serializeToExcalidrawJson(
  elements: CanvasElement[],
  viewport: ViewportState,
  backgroundColor = '#ffffff'
): string {
  const exportData: ExcalidrawExportJson = {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements: elements.filter((el) => !el.isDeleted),
    appState: {
      viewBackgroundColor: backgroundColor,
      zoom: { value: viewport.zoom },
      scrollX: viewport.scrollX,
      scrollY: viewport.scrollY,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadExcalidrawFile(
  elements: CanvasElement[],
  viewport: ViewportState,
  title = 'drawing',
  backgroundColor = '#ffffff'
) {
  const json = serializeToExcalidrawJson(elements, viewport, backgroundColor);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedTitle = title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'drawing';
  a.download = `${sanitizedTitle}.excalidraw`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface LoadedExcalidrawFile {
  elements: CanvasElement[];
  appState?: {
    viewBackgroundColor?: string;
    zoom?: { value: number } | number;
    scrollX?: number;
    scrollY?: number;
  };
}

export async function parseExcalidrawFile(file: File): Promise<LoadedExcalidrawFile> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data || !Array.isArray(data.elements)) {
    throw new Error('Invalid Excalidraw file format: missing elements array');
  }

  const elements: CanvasElement[] = data.elements.map((el: any) => ({
    id: el.id || Math.random().toString(36).substring(2, 9),
    type: el.type || 'rectangle',
    x: el.x || 0,
    y: el.y || 0,
    width: el.width || 100,
    height: el.height || 100,
    strokeColor: el.strokeColor || '#1e1e1e',
    backgroundColor: el.backgroundColor || 'transparent',
    fillStyle: el.fillStyle || 'none',
    strokeWidth: el.strokeWidth || 2,
    strokeStyle: el.strokeStyle || 'solid',
    roughness: typeof el.roughness === 'number' ? el.roughness : 1,
    opacity: el.opacity ?? 100,
    angle: el.angle || 0,
    points: el.points || [],
    text: el.text || '',
    fontSize: el.fontSize || 20,
    textAlign: el.textAlign || 'left',
    roundness: el.roundness?.type === 3 ? 'round' : 'sharp',
    isDeleted: el.isDeleted || false,
  }));

  return {
    elements,
    appState: data.appState,
  };
}
