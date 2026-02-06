// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI]
// Home page component that serves as the application landing page. All content,
// branding, navigation, and styling are driven by YAML configuration files
// (config/site.yaml and config/theme.yaml). Rendered as a server component
// by default for optimal performance and SEO.

import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { getSiteConfig, getThemeConfig, getOverride } from "../lib/config";
import type { ButtonConfig, ImageConfig } from "../lib/config.types";

// ---------------------------------------------------------------------------
// Helper: render description text with inline link placeholders
// ---------------------------------------------------------------------------

// [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI]
// Parses the description string and replaces {key} placeholders with
// anchor elements whose href/label come from site config inlineLinks.
function renderDescription(
  template: string,
  inlineLinks: Record<string, { label: string; href: string }>,
  security: { target: string; rel: string },
  inlineLinkClass: string,
): React.ReactNode[] {
  // Split on {word} tokens, keeping the token in the result array
  const parts = template.split(/(\{[a-zA-Z_]+\})/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\{([a-zA-Z_]+)\}$/);
    if (match) {
      const key = match[1];
      const link = inlineLinks[key];
      if (link) {
        return (
          <a
            key={idx}
            href={link.href}
            className={inlineLinkClass}
            target={security.target}
            rel={security.rel}
          >
            {link.label}
          </a>
        );
      }
    }
    // Plain text segment
    return <span key={idx}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Helper: render a configurable image
// ---------------------------------------------------------------------------

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING] [REQ-CONFIG_DRIVEN_UI]
function ConfigImage({
  image,
  priority = false,
}: {
  image: ImageConfig;
  priority?: boolean;
}) {
  return (
    <Image
      className={image.darkInvert ? "dark:invert" : undefined}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      priority={priority}
    />
  );
}

// ---------------------------------------------------------------------------
// Helper: render a CTA button from config
// ---------------------------------------------------------------------------

// [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI]
function CtaButton({
  button,
  security,
  className,
}: {
  button: ButtonConfig;
  security: { target: string; rel: string };
  className: string;
}) {
  return (
    <a
      className={className}
      href={button.href}
      target={security.target}
      rel={security.rel}
    >
      {button.icon && <ConfigImage image={button.icon} />}
      {button.label}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Home() {
  // [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
  // Load site and theme configurations from YAML files.
  const site = getSiteConfig();
  const theme = getThemeConfig();
  const { overrides } = theme;

  // [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]
  // Build Tailwind class strings. Default classes match the original design;
  // overrides from config/theme.yaml are merged on top via tailwind-merge.
  const outerContainerClass = twMerge(
    "flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black",
    getOverride(overrides, "outerContainer"),
  );

  const mainClass = twMerge(
    `flex min-h-screen w-full max-w-${theme.sizing.maxContentWidth} flex-col items-center justify-between py-${theme.spacing.page.paddingY} px-${theme.spacing.page.paddingX} bg-white dark:bg-black sm:items-start`,
    getOverride(overrides, "main"),
  );

  const contentSectionClass = twMerge(
    `flex flex-col items-center gap-${theme.spacing.contentGap} text-center sm:items-start sm:text-left`,
    getOverride(overrides, "contentSection"),
  );

  const headingClass = twMerge(
    "max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50",
    getOverride(overrides, "heading"),
  );

  const paragraphClass = twMerge(
    "max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400",
    getOverride(overrides, "paragraph"),
  );

  const inlineLinkClass = twMerge(
    "font-medium text-zinc-950 dark:text-zinc-50",
    getOverride(overrides, "inlineLink"),
  );

  const buttonGroupClass = twMerge(
    `flex flex-col gap-${theme.spacing.buttonGap} text-base font-medium sm:flex-row`,
    getOverride(overrides, "buttonGroup"),
  );

  const primaryButtonClass = twMerge(
    `flex h-${theme.sizing.buttonHeight} w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[${theme.sizing.buttonDesktopWidth}]`,
    getOverride(overrides, "primaryButton"),
  );

  const secondaryButtonClass = twMerge(
    `flex h-${theme.sizing.buttonHeight} w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[${theme.sizing.buttonDesktopWidth}]`,
    getOverride(overrides, "secondaryButton"),
  );

  // Map variant to class string for button rendering
  const buttonVariantClass: Record<string, string> = {
    primary: primaryButtonClass,
    secondary: secondaryButtonClass,
  };

  return (
    // [IMPL-FLEX_LAYOUT] [IMPL-DARK_MODE] [REQ-RESPONSIVE_DESIGN] [REQ-DARK_MODE] [REQ-CONFIG_DRIVEN_UI]
    <div className={outerContainerClass}>
      {/* [IMPL-FLEX_LAYOUT] [IMPL-RESPONSIVE_CLASSES] [REQ-ROOT_LAYOUT] [REQ-RESPONSIVE_DESIGN] */}
      <main className={mainClass}>
        {/* [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING] [REQ-CONFIG_DRIVEN_UI]
            Logo rendered from site config branding section. */}
        <ConfigImage image={site.branding.logo} priority />

        {/* [IMPL-FLEX_LAYOUT] [IMPL-RESPONSIVE_CLASSES] [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI] */}
        <div className={contentSectionClass}>
          {/* [REQ-HOME_PAGE] [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI]
              Heading text from site config. */}
          <h1 className={headingClass}>{site.content.heading}</h1>

          {/* [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS] [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI]
              Description with inline links parsed from config placeholders. */}
          <p className={paragraphClass}>
            {renderDescription(
              site.content.description,
              site.navigation.inlineLinks,
              site.navigation.security,
              inlineLinkClass,
            )}
          </p>
        </div>

        {/* [IMPL-FLEX_LAYOUT] [IMPL-RESPONSIVE_CLASSES] [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI]
            CTA buttons rendered from site config navigation.buttons array. */}
        <div className={buttonGroupClass}>
          {site.navigation.buttons.map((button, idx) => (
            <CtaButton
              key={idx}
              button={button}
              security={site.navigation.security}
              className={buttonVariantClass[button.variant] ?? secondaryButtonClass}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
