export const colors = {
  // Brand
  primary:      '#F97316',   // orange-500 — buttons, active states, accents
  primaryDark:  '#EA580C',   // orange-600 — pressed state
  primaryLight: '#FFF7ED',   // orange-50  — selected chip bg, subtle tints

  // Text / neutrals — warm stone scale (not cold blue-gray)
  secondary:   '#44403C',   // stone-700
  muted:       '#78716C',   // stone-500
  placeholder: '#A8A29E',   // stone-400
  border:      '#D6D3D1',   // stone-300
  borderLight: '#E7E5E4',   // stone-200
  ghostBg:     '#F5F5F4',   // stone-100
  screenBg:    '#FFFBF7',   // warm cream
  white:       '#ffffff',

  // Semantic
  danger:      '#dc2626',
  dangerDark:  '#b91c1c',
  dangerLight: '#fee2e2',
  dangerText:  '#ef4444',
  link:        '#2563eb',

  // Overlay
  overlay: 'rgba(0,0,0,0.45)',
} as const;
