export type Tool =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pencil'
  | 'text'
  | 'eraser'
  | 'laser';

export type ElementType =
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pencil'
  | 'text';

export type FillStyle = 'none' | 'hachure' | 'cross-hatch' | 'solid';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export type Roughness = 0 | 1 | 2; // 0 = Architect (clean), 1 = Artist (rough), 2 = Cartoonist (sloppy)

export interface Point {
  x: number;
  y: number;
}

export interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

export interface LaserTrail {
  userId: string;
  color: string;
  points: LaserPoint[];
}

export interface Collaborator {
  id: string;
  username: string;
  color: string;
  cursor?: Point;
  lastSeen: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: Roughness;
  opacity: number; // 0 to 100
  angle: number;
  points?: Point[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  roundness?: 'sharp' | 'round';
  isDeleted?: boolean;
}

export interface ViewportState {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotation'
  | null;

export type ActionState =
  | 'none'
  | 'drawing'
  | 'moving'
  | 'resizing'
  | 'panning'
  | 'erasing'
  | 'laser'
  | 'selecting'
  | 'editing-text';

export interface ElementProperties {
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: Roughness;
  roundness: 'sharp' | 'round';
  opacity: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ExcalidrawExportJson {
  type: 'excalidraw';
  version: 2;
  source: string;
  elements: CanvasElement[];
  appState: {
    viewBackgroundColor: string;
    zoom: { value: number };
    scrollX: number;
    scrollY: number;
  };
}
