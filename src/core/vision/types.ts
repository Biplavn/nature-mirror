export interface VisionConfig {
  width: number;
  height: number;
  fps: number;
  modelComplexity?: 0 | 1;
  cameraWidth?: number;
  cameraHeight?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface HandPosition {
  position: Point2D;
  confidence: number;
}

export interface SegmentationResult {
  width: number;
  height: number;
  data: Uint8Array; // Alpha mask (0-255)
  hands: {
    left: HandPosition | null;
    right: HandPosition | null;
  };
  head: Point2D | null;
  bodyCenter: Point2D | null;
}
