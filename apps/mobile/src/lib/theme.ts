// ─────────────────────────────────────────────────────────────
// MediLoop Design System – Theme
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // Primary brand
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primarySurface: '#EEF2FF',

  // Secondary
  secondary: '#0EA5E9',
  secondaryLight: '#7DD3FC',
  secondarySurface: '#F0F9FF',

  // Semantic
  success: '#10B981',
  successLight: '#6EE7B7',
  successSurface: '#ECFDF5',

  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningSurface: '#FFFBEB',

  error: '#EF4444',
  errorLight: '#FCA5A5',
  errorSurface: '#FEF2F2',

  info: '#3B82F6',
  infoLight: '#93C5FD',
  infoSurface: '#EFF6FF',

  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status colors for medications
  statusTaken: '#10B981',
  statusMissed: '#EF4444',
  statusSkipped: '#F59E0B',
  statusScheduled: '#4F46E5',
  statusSnoozed: '#8B5CF6',

  // Medication card colors
  medPurple: '#7C3AED',
  medBlue: '#2563EB',
  medGreen: '#059669',
  medOrange: '#D97706',
  medRed: '#DC2626',
  medPink: '#DB2777',
  medTeal: '#0891B2',

  // Border
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
} as const;

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Medication card background gradients (pre-defined palettes)
export const MedicationColors = [
  { bg: '#EEF2FF', accent: '#4F46E5', text: '#3730A3' },
  { bg: '#FEF3C7', accent: '#D97706', text: '#92400E' },
  { bg: '#DCFCE7', accent: '#16A34A', text: '#14532D' },
  { bg: '#FEE2E2', accent: '#DC2626', text: '#7F1D1D' },
  { bg: '#F0FDF4', accent: '#059669', text: '#064E3B' },
  { bg: '#EDE9FE', accent: '#7C3AED', text: '#4C1D95' },
  { bg: '#E0F2FE', accent: '#0284C7', text: '#0C4A6E' },
  { bg: '#FCE7F3', accent: '#BE185D', text: '#831843' },
] as const;
