// --- PRIMITIVES (Raw values: Scaling, Colors, etc.) ---
const primitives = {
  spacing: {
    SpacingExtraHuge: '6.5rem',
    SpacingHuge: '5rem',
    SpacingExtraLarge: '4rem',
    SpacingLarge: '3rem',
    SpacingMedium: '2rem',
    SpacingBase: '1rem',
    SpacingSmall: '0.75rem',
    SpacingTiny: '0.5rem',
    SpacingNano: '0.25rem',
  },
  fontSizes: {
    FontSizeDisplay: '3rem',
    FontSizeH1: '2.25rem',
    FontSizeH2: '1.875rem',
    FontSizeH3: '1.5rem',
    FontSizeH4: '1.25rem',
    FontSizeBase: '1rem',
    FontSizeSm: '0.875rem',
    FontSizeXs: '0.75rem',
    FontSizeNano: '0.625rem',
  },
  lineHeights: {
    LineHeightTight: '1.2',
    LineHeightNormal: '1.5',
    LineHeightRelaxed: '1.625',
  },
  opacities: {
    OpacityOpaque: '1',
    OpacityHigh: '0.8',
    OpacitySubtle: '0.5',
    OpacityMuted: '0.1',
  },
  borderWidths: {
    BorderNone: '0',
    BorderThin: '0.0625rem', // 1px
    BorderMedium: '0.125rem', // 2px
    BorderThick: '0.25rem',  // 4px
  },
  /* --- LEGACY: Breakpoints are now handled by Viewport Engine in GlobalContext --- */
  /* 
  breakpoints: {
    BreakpointSm: '40rem',   // 640px
    BreakpointMd: '48rem',   // 768px
    BreakpointLg: '64rem',   // 1024px
    BreakpointXl: '80rem',   // 1280px
    Breakpoint2xl: '96rem',  // 1536px
  },
  */
  colors: {
    PrimaryLight: '#0336A3',
    PrimaryDark: '#ad8407',
    Secondary: '#64748B',
    Tertiary: '#94A3B8',
    Slate50: '#F8FAFC',
    Slate100: '#F1F5F9',
    Slate200: '#E2E8F0',
    Slate300: '#CBD5E1',
    Slate400: '#94A3B8',
    Slate500: '#64748B',
    Slate600: '#475569',
    Slate700: '#334155',
    Slate800: '#1E293B',
    Slate900: '#0F172A',
    Black: '#000000',
    White: '#FFFFFF',
  },
};

// --- SEMANTIC (Meaningful mappings for UI) ---
const semantic = {
  // Theme Colors
  colors: {
    light: {
      ColorBg: '#FFFFFF',               // White (Garis Pembatas)
      ColorBgSecondary: '#00FF00',      // Lime (Background Sekunder)
      ColorPrimary: '#11522e',          // Cyan (Tombol/Elemen Utama)
      ColorSecondary: '#f09f2e',        // Orange (Elemen Sekunder)
      ColorTertiary: '#f0dfc7',         // Purple (Elemen Tersier)
      ColorSidebar: '#ffffff',          // Yellow (Area Sidebar)
      ColorSidebarForeground: '#CC0000',// Red (Teks Sidebar)
      ColorSidebarAccent: '#0099FF',    // Sky Blue (Hover/Active Sidebar)
      ColorSidebarBorder: '#11522e',    // Pink (Background Utama)
      ColorSidebarRing: '#000000',      // Black (Focus Ring)
      ColorBgInverse: '#000000',        // Navy (Elemen Kebalikan)
      TextColorBase: '#000000',         // Bright Red (Teks Utama)
      TextColorMuted: '#616161',        // Dark Green (Teks Redup)
      FeedbackColorSuccess: '#10B981',
      FeedbackColorWarning: '#F59E0B',
      FeedbackColorError: '#EF4444',
      FeedbackColorInfo: '#3B82F6',
    },
    dark: {
      ColorBg: '#000000',
      ColorBgSecondary: '#0F172A',
      ColorPrimary: '#ad8407',
      ColorSecondary: '#94A3B8',
      ColorTertiary: '#64748B',
      ColorSidebar: '#0F172A',
      ColorSidebarForeground: '#F8FAFC',
      ColorSidebarAccent: '#1E293B',
      ColorSidebarBorder: '#334155',
      ColorSidebarRing: '#ad8407',
      ColorBgInverse: '#F8FAFC',
      TextColorBase: '#F8FAFC',
      TextColorMuted: '#94A3B8',
      FeedbackColorSuccess: '#34D399',
      FeedbackColorWarning: '#FBBF24',
      FeedbackColorError: '#F87171',
      FeedbackColorInfo: '#60A5FA',
    },
  },
  // Focus States
  focus: {
    FocusRingWidth: '0.125rem',
    FocusRingOffset: '0.125rem',
    FocusRingColor: 'var(--ColorPrimary)',
  },
  // Typography Styles (Compound Tokens)
  typography: {
    FontFamilyPrimary: '"switzer", system-ui, sans-serif',
    FontFamilySecondary: '"Space Grotesk", sans-serif',
    TypographyBody: 'font-normal leading-normal',
    TypographyHeading: 'font-bold leading-tight tracking-tight',
    TypographyMuted: 'font-normal leading-normal text-opacity-50',
  },
  // Visual Effects
  radii: {
    RadiusNone: '0',
    RadiusTiny: '0.125rem',
    RadiusSmall: '0.25rem',
    RadiusMedium: '0.5rem',
    RadiusBase: '0.75rem',
    RadiusLarge: '1rem',
    RadiusFull: '99rem',
  },
  elevations: {
    ElevationFlat: 'none',
    ElevationLow: '0 0.125rem 0.25rem rgba(0,0,0,0.05)',
    ElevationNormal: '0 0.25rem 0.375rem rgba(0,0,0,0.1)',
    ElevationHigh: '0 0.625rem 0.9375rem rgba(0,0,0,0.15)',
    ElevationSm: '0 0.0625rem 0.125rem rgba(0,0,0,0.05)',
    ElevationMd: '0 0.25rem 0.375rem -0.0625rem rgba(0,0,0,0.1)',
    ElevationLg: '0 0.625rem 0.9375rem -0.1875rem rgba(0,0,0,0.1)',
    ElevationXl: '0 1.25rem 1.5625rem -0.3125rem rgba(0,0,0,0.1)',
  },
  zIndices: {
    ZBelow: '-1',
    ZFlat: '0',
    ZRaised: '10',
    ZOverlay: '100',
    ZDropdown: '1000',
    ZSticky: '1020',
    ZFixed: '1030',
    ZModal: '1050',
    ZPopover: '1060',
    ZTooltip: '1070',
    ZTopmost: '9999',
  },
  durations: {
    DurationFast: '200ms',
    DurationMid: '400ms',
    DurationSlow: '800ms',
  },
  transforms: {
    TransformShort: '0.25rem',
    TransformMedium: '0.5rem',
    TransformLong: '1rem',
    TransformShrink: '0.95',
    TransformBase: '1',
    TransformGrow: '1.05',
  },
};

export const tokens = {
  // --- CORE COLLECTIONS ---
  primitives,
  semantic,

  // --- TOP-LEVEL EXPORTS (Backward Compatibility & Ease of Use) ---
  colors: semantic.colors,
  textColors: semantic.colors,      // Alias for grouped colors
  feedbackColors: semantic.colors,  // Alias for grouped colors
  fontSizes: primitives.fontSizes,
  fonts: semantic.typography,       // FontFamilyPrimary, etc.
  spacing: primitives.spacing,
  durations: semantic.durations,
  radii: semantic.radii,
  zIndices: semantic.zIndices,
  elevations: semantic.elevations,
  transforms: semantic.transforms,
  containers: {
    ContainerXs: '20rem',
    ContainerSm: '30rem',
    ContainerMd: '40rem',
    ContainerLg: '50rem',
    ContainerXl: '64rem',
    ContainerFull: '100%',
  },
  chartColors: {
    ChartColor1: '#0ea5e9',
    ChartColor2: '#10b981',
    ChartColor3: '#f59e0b',
    ChartColor4: '#ef4444',
    ChartColor5: '#8b5cf6',
  },
  gradients: {
    GradientG1: 'linear-gradient(to bottom, #38ef7d, #11998e)',
    GradientG2: 'linear-gradient(to right, #0f9b0f, #000000)',
    GradientG3: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    GradientG4: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    GradientG5: 'linear-gradient(135deg, #000000 0%, #1e293b 100%)',
    GradientMaindi: 'linear-gradient(135deg, #000000 0%, #1e293b 100%)',
  },
};
