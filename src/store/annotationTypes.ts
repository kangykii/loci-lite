export type AnnotationCoordinateSystem = 'visible_text';

export type AnnotationRecord = {
  id: string;
  fileId: string;
  spanStart: number;
  spanEnd: number;
  source: 'ai' | 'paste';
  createdAt: number;
  coordinateSystem: AnnotationCoordinateSystem;
};

export type AnnotationRow = {
  id: string;
  file_id: string;
  span_start: number;
  span_end: number;
  source: 'ai' | 'paste';
  created_at: number;
  coordinate_system: AnnotationCoordinateSystem | null;
};
