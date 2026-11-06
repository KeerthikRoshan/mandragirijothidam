/**
 * Color Palette for Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்)
 * Vedic Minimalist Brand Theme
 */

export const colors = {
  // Brand Core
  primary: '#145C43', // Primary Forest Green
  primaryDark: '#0B3D2E', // Dark Green
  gold: '#C6A15B', // Gold Accent (used sparingly)

  // Backgrounds
  background: '#FFFFFF', // Pure White
  backgroundSecondary: '#F7F8F7', // Light Muted Green-Grey

  // Typography
  textPrimary: '#202520', // Near Black for High Readability
  textSecondary: '#737B75', // Muted Gray for Placeholders / Subtitles
  textInverse: '#FFFFFF', // White text on dark green surfaces

  // Borders & Dividers
  border: '#E6EAE6', // Subtle border
  borderFocused: '#145C43', // Focused input border
  borderError: '#C64242', // Error state border

  // Status & Alerts
  error: '#C64242', // Error text & indicators
  errorLight: '#FDF2F2', // Error container background
  success: '#1F8A70', // Success green
  info: '#2E5B88', // Info / Dev notice blue
  infoLight: '#F0F5FA', // Info container background

  // States
  buttonDisabled: '#93B5A9', // Disabled state for primary button
  inputBackground: '#FFFFFF', // Input fill
  inputDisabled: '#F2F4F2', // Disabled input fill
} as const;

export type ColorName = keyof typeof colors;
