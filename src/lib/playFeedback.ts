import type { Area } from '@/lib/area';

export type Mark = {
  area: Area;
  message?: string;
  supervisor?: boolean;
};

export type Feedback =
  | { tone: 'normal'; area: Area; message: string; reward?: number }
  | { tone: 'positive'; message: string }
  | { tone: 'supervisor'; message: string; action?: string; area?: Area; isUpdated?: boolean };

export type Caution = { area: Area; message: string };

export type ApiMarking = {
  domain: Area;
  feedback: string;
};

export type ApiMeasureMarking = {
  measure_index: number;
  markings: ApiMarking[];
};

const PREV_CLASS: Record<Area, string> = {
  pitch: 'border-2 border-pitch bg-background',
  rhythm: 'border-2 border-rhythm bg-background',
  posture: 'border-2 border-posture bg-background',
};

const PREV_BORDER_CLASS: Record<Area, string> = {
  pitch: 'border-2 border-pitch',
  rhythm: 'border-2 border-rhythm',
  posture: 'border-2 border-posture',
};

const CURRENT_CLASS: Record<Area, string> = {
  pitch: 'bg-pitch/60',
  rhythm: 'bg-rhythm/60',
  posture: 'bg-posture/60',
};

export function markClass(area: Area, layer: 'previous' | 'current'): string {
  return layer === 'previous' ? PREV_CLASS[area] : CURRENT_CLASS[area];
}

export function markBorderClass(area: Area): string {
  return PREV_BORDER_CLASS[area];
}

export function previousMarksByMeasure(measures: ApiMeasureMarking[]): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();

  for (const measure of measures) {
    const barIndex = measure.measure_index - 1;
    if (barIndex < 0) continue;

    map.set(
      barIndex,
      measure.markings.map((marking) => ({
        area: marking.domain,
        message: marking.feedback,
      })),
    );
  }

  return map;
}
