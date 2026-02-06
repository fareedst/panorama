// [IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
// TypeScript interfaces defining the shape of YAML configuration files.
// These types ensure type safety when loading and consuming config values.

// ---------------------------------------------------------------------------
// Site Configuration (config/site.yaml)
// ---------------------------------------------------------------------------

/** Image/logo reference used across branding and navigation buttons. */
export interface ImageConfig {
  /** Path to image file (relative to /public) */
  src: string;
  /** Accessible alt text */
  alt: string;
  /** Intrinsic width in pixels */
  width: number;
  /** Intrinsic height in pixels */
  height: number;
  /** Whether to apply dark:invert class for dark-mode visibility */
  darkInvert?: boolean;
}

/** Page-level metadata exported via Next.js Metadata API. */
export interface MetadataConfig {
  title: string;
  description: string;
}

/** Branding section – logos and identity assets. */
export interface BrandingConfig {
  logo: ImageConfig;
}

/** An inline link embedded within paragraph text via a placeholder token. */
export interface InlineLinkConfig {
  label: string;
  href: string;
}

/** A call-to-action button displayed below content. */
export interface ButtonConfig {
  label: string;
  href: string;
  /** "primary" renders a filled button; "secondary" renders an outlined button. */
  variant: "primary" | "secondary";
  /** Optional icon displayed inside the button. */
  icon?: ImageConfig;
}

/** Link security attributes applied to all external links. */
export interface LinkSecurityConfig {
  target: string;
  rel: string;
}

/** Navigation section – inline links, CTA buttons, and security policy. */
export interface NavigationConfig {
  /** Keyed map of inline links; keys are used as placeholders in content.description */
  inlineLinks: Record<string, InlineLinkConfig>;
  /** Ordered list of CTA buttons */
  buttons: ButtonConfig[];
  /** Security attributes for external links */
  security: LinkSecurityConfig;
}

/** Page content – headings and body text. */
export interface ContentConfig {
  /** Main heading text */
  heading: string;
  /**
   * Descriptive paragraph. Supports placeholders like {templates} and {learning}
   * that are replaced with inline link components at render time.
   */
  description: string;
}

/** Top-level site configuration schema (config/site.yaml). */
export interface SiteConfig {
  metadata: MetadataConfig;
  /** HTML lang attribute value */
  locale: string;
  branding: BrandingConfig;
  content: ContentConfig;
  navigation: NavigationConfig;
}

// ---------------------------------------------------------------------------
// Theme Configuration (config/theme.yaml)
// ---------------------------------------------------------------------------

/** Color values for a single mode (light or dark). */
export interface ColorMode {
  background: string;
  foreground: string;
  /** Additional custom CSS variables (key = variable name, value = color) */
  [key: string]: string;
}

/** Full color palette with light and dark modes. */
export interface ColorsConfig {
  light: ColorMode;
  dark: ColorMode;
}

/** Font configuration for a single font family. */
export interface FontConfig {
  /** CSS variable name (e.g. "--font-geist-sans") */
  variable: string;
  /** Fallback font stack (e.g. "Arial, Helvetica, sans-serif") */
  fallback?: string;
}

/** Font system configuration. */
export interface FontsConfig {
  sans: FontConfig;
  mono: FontConfig;
}

/** Page-level spacing values (Tailwind size tokens, e.g. "32" → py-32). */
export interface PageSpacingConfig {
  paddingY: string;
  paddingX: string;
}

/** Spacing configuration. */
export interface SpacingConfig {
  page: PageSpacingConfig;
  contentGap: string;
  buttonGap: string;
}

/** Sizing configuration for width/height constraints. */
export interface SizingConfig {
  /** Tailwind max-width token (e.g. "3xl" → max-w-3xl) */
  maxContentWidth: string;
  /** Tailwind height token (e.g. "12" → h-12) */
  buttonHeight: string;
  /** Exact pixel width for buttons on desktop (e.g. "158px") */
  buttonDesktopWidth: string;
}

/**
 * Per-element Tailwind class overrides for advanced users.
 * Each key maps to additional classes merged onto the element's defaults.
 * Empty strings are ignored.
 */
export interface ClassOverrides {
  outerContainer?: string;
  main?: string;
  heading?: string;
  paragraph?: string;
  contentSection?: string;
  buttonGroup?: string;
  primaryButton?: string;
  secondaryButton?: string;
  inlineLink?: string;
}

/** Top-level theme configuration schema (config/theme.yaml). */
export interface ThemeConfig {
  colors: ColorsConfig;
  fonts: FontsConfig;
  spacing: SpacingConfig;
  sizing: SizingConfig;
  /** Per-element class overrides (advanced). All keys are optional. */
  overrides: ClassOverrides;
  /** Jobs app layout and status badge classes (optional). [REQ-CONFIG_DRIVEN_APPEARANCE] */
  jobs?: JobsThemeConfig;
}

// ---------------------------------------------------------------------------
// Jobs configuration (config/jobs.yaml) [REQ-CONFIG_DRIVEN_APPEARANCE]
// ---------------------------------------------------------------------------

/** Jobs app section in theme (layout overrides + status badge classes). */
export interface JobsThemeConfig {
  /** Per-element class overrides for jobs pages/components. */
  overrides?: JobsThemeOverrides;
  /** Status value → Tailwind class string for badges (e.g. applied, rejected). */
  statusBadges?: Record<string, string>;
}

export interface JobsThemeOverrides {
  pageContainer?: string;
  card?: string;
  table?: string;
  tableHeader?: string;
  primaryButton?: string;
  secondaryButton?: string;
  dangerButton?: string;
  /** Default badge when status has no mapping */
  statusBadgeDefault?: string;
  // [REQ-JOB_TRACKER_CALENDAR] Calendar view overrides
  calendarGrid?: string;
  calendarCell?: string;
  calendarCellToday?: string;
  calendarItem?: string;
  calendarDetailPanel?: string;
}

/** Select option for jobs config fields. */
export interface JobsFieldOption {
  value: string;
  label: string;
}

/** Single field definition in config/jobs.yaml. */
export interface JobsFieldConfig {
  name: string;
  label: string;
  type: "text" | "date" | "textarea" | "select" | "url-list";
  required?: boolean;
  showInTable?: boolean;
  options?: JobsFieldOption[];
}

/** Copy strings for jobs UI (all user-facing text from config). */
export interface JobsCopyConfig {
  listTitle?: string;
  listSubtitle?: string;
  addNewButton?: string;
  emptyTitle?: string;
  emptyLink?: string;
  editLink?: string;
  editPageTitle?: string;
  backToList?: string;
  backToCalendar?: string;
  deleteButton?: string;
  deleteConfirm?: string;
  newPageTitle?: string;
  newPageSubtitle?: string;
  positionDetails?: string;
  applications?: string;
  addApplication?: string;
  editApplication?: string;
  saveButton?: string;
  updateButton?: string;
  addButton?: string;
  cancel?: string;
  remove?: string;
  addUrl?: string;
  createPosition?: string;
  updatePosition?: string;
  saving?: string;
  // [REQ-JOB_TRACKER_CALENDAR] Calendar view copy
  calendarTitle?: string;
  calendarSubtitle?: string;
  calendarPrev?: string;
  calendarNext?: string;
  calendarToday?: string;
  calendarNoItems?: string;
  calendarPositionLabel?: string;
  calendarApplicationLabel?: string;
  calendarDetailClose?: string;
  calendarBackToList?: string;
  calendarDayNames?: string;
  calendarViewButton?: string;
}

export interface JobsAppConfig {
  title: string;
  description: string;
}

export interface JobsTableConfig {
  defaultSort: string;
  defaultSortDirection: "asc" | "desc";
}

/** Top-level jobs configuration schema (config/jobs.yaml). */
export interface JobsConfig {
  app: JobsAppConfig;
  fields: JobsFieldConfig[];
  table: JobsTableConfig;
  copy?: JobsCopyConfig;
}
