export const UNITS = ['kg', 'g', 'l', 'ml', 'szt.', 'op.'] as const;

export type Unit = (typeof UNITS)[number];