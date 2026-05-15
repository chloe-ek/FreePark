export type LayerKind = 'meter' | 'disability' | 'motorcycle' | 'ev';

export const LAYER_COLORS: Record<LayerKind, string> = {
  meter:      '#6b7280',
  disability: '#2563eb',
  motorcycle: '#7c3aed',
  ev:         '#16a34a',
} as const;

export const LAYER_LABELS: Record<LayerKind, string> = {
  meter:      'P',
  disability: '♿',
  motorcycle: '🏍',
  ev:         '⚡',
} as const;
