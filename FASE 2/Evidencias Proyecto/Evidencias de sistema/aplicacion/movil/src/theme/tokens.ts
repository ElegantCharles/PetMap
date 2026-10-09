// Tokens de diseño de MeinPets. Fuente de verdad visual: docs/diseno/DESIGN.md
// Prohibido usar hex, tamaños de fuente o radios sueltos fuera de este archivo.

export const colors = {
  ground: '#F1F5F2',
  surface: '#FFFFFF',
  ink: '#0F2A2A',
  inkLabel: '#3F5957',
  inkSoft: '#5A7371',
  placeholder: '#8AA09C',
  teal: '#0B6B63',
  tealPressed: '#095A53',
  mint: '#D6EBE4',
  mintSelected: '#E3F1EC',
  ball: '#E4F25A',
  ballInk: '#2E3F10',
  line: '#C5D7D1',
  divider: '#E3ECE8',
  danger: '#B3261E',
  dangerBg: '#FBE4E1',
  scrim: 'rgba(15,42,42,0.45)',
  scrimSoft: 'rgba(15,42,42,0.28)',
  onTeal: '#FFFFFF',
  onTealSoft: '#CFE8E2',
  onTealGlass: 'rgba(255,255,255,0.14)',
} as const;

// Semáforo de refuerzos. Siempre acompañado de texto, nunca solo color.
export const status = {
  vencido: { bg: '#FBE4E1', fg: '#8E1B14' },
  proximo: { bg: '#FFF0C2', fg: '#6B4500' },
  al_dia: { bg: '#D6EBE4', fg: '#0A4A44' },
  sin_fecha: { bg: '#E9EEEC', fg: '#4A6361' },
} as const;

export type StatusKey = keyof typeof status;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  text: 'Figtree_400Regular',
  textMedium: 'Figtree_500Medium',
  textSemi: 'Figtree_600SemiBold',
} as const;

export const radii = {
  hero: 36,
  card: 28,
  field: 22,
  row: 20,
  tile: 18,
  pill: 22,
  button: 18,
  chip: 20,
} as const;

export const space = { gutter: 20, tight: 8, gap: 12, section: 24 } as const;

export const type = {
  petName: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -0.8 },
  bigDate: { fontFamily: fonts.display, fontSize: 46, lineHeight: 50, letterSpacing: -1.4 },
  midDate: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -1.1 },
  screenTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  cardTitle: { fontFamily: fonts.displaySemi, fontSize: 19, lineHeight: 24 },
  rowTitle: { fontFamily: fonts.textSemi, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.text, fontSize: 15, lineHeight: 21 },
  bodySemi: { fontFamily: fonts.textSemi, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.textSemi, fontSize: 14, lineHeight: 18 },
  small: { fontFamily: fonts.text, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: fonts.text, fontSize: 12, lineHeight: 16 },
} as const;

export type CategoryKey =
  | 'vacuna'
  | 'desparasitacion_interna'
  | 'desparasitacion_externa';

// Icono por categoría: forma y luminosidad distintas, no solo color.
export const categoryStyle: Record<CategoryKey, { bg: string; fg: string }> = {
  vacuna: { bg: colors.teal, fg: colors.onTeal },
  desparasitacion_externa: { bg: colors.ball, fg: colors.ink },
  desparasitacion_interna: { bg: colors.mint, fg: colors.ink },
};

// Única sombra del sistema: la tarjeta que flota sobre la cabecera.
export const floatingShadow = {
  shadowColor: colors.ink,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.09,
  shadowRadius: 28,
  elevation: 3,
} as const;
