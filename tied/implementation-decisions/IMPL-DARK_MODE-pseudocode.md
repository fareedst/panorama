# IMPL-DARK_MODE essence pseudocode

## TAILWIND_THEME_INLINE_MAP
# [IMPL-DARK_MODE] [ARCH-CSS_VARIABLES] [ARCH-TAILWIND_V4] [REQ-DARK_MODE] [REQ-CONFIG_DRIVEN_UI]
# how: Map injected CSS custom properties to Tailwind v4 theme tokens via @theme inline in globals.css.

```
TAILWIND_THEME_INLINE_MAP():
  DATA: --background, --foreground from theme injection; --font-geist-sans, --font-geist-mono from next/font
  MAP --color-background := var(--background)
  MAP --color-foreground := var(--foreground)
  MAP --font-sans := var(--font-geist-sans)
  MAP --font-mono := var(--font-geist-mono)
  OUTPUT: Tailwind utilities (bg-background, text-foreground, font-sans) resolve through CSS variables
```

## BODY_APPLY_THEME_VARIABLES
# [IMPL-DARK_MODE] [ARCH-CSS_VARIABLES] [REQ-DARK_MODE] [REQ-GLOBAL_STYLES] [REQ-CONFIG_DRIVEN_UI]
# how: Apply --background and --foreground on body; values switch via prefers-color-scheme without JavaScript.

```
BODY_APPLY_THEME_VARIABLES():
  OUTPUT: body { background: var(--background); color: var(--foreground); font-family: var(--font-geist-sans, fallback) }
  CONTROL: color values originate from config/theme.yaml injected by IMPL-THEME_INJECTION layout <style> tag
  CONTROL: @media (prefers-color-scheme: dark) overrides :root variables for dark palette
```

## SYSTEM_PREFERENCE_COLOR_SWITCH
# [IMPL-DARK_MODE] [ARCH-CSS_VARIABLES] [REQ-DARK_MODE] [REQ-CONFIG_DRIVEN_UI]
# how: Light/dark palettes come from theme config; generateThemeCss emits prefers-color-scheme media query (IMPL-THEME_INJECTION).

```
SYSTEM_PREFERENCE_COLOR_SWITCH(themeConfig):
  INPUT: themeConfig.colors.light { background, foreground, ... }
  INPUT: themeConfig.colors.dark { background, foreground, ... }
  OUTPUT: CSS :root light vars; @media (prefers-color-scheme: dark) { :root dark vars }
  DATA: light background #ffffff, foreground #171717; dark background #0a0a0a, foreground #ededed (defaults)
  CONTROL: zero JavaScript at runtime; browser applies matching block automatically
```

## TAILWIND_DARK_PREFIX_UTILITIES
# [IMPL-DARK_MODE] [REQ-DARK_MODE]
# how: Components use Tailwind dark: prefix utilities paired with light defaults for automatic scheme switching.

```
TAILWIND_DARK_PREFIX_UTILITIES():
  DATA: utility pairs e.g. bg-zinc-50 + dark:bg-black, text-black + dark:text-zinc-50
  DATA: branding logos may use dark:invert for SVG visibility
  OUTPUT: class strings matching /^dark:/ pattern where dark variant required
```

## CONTRAST_ACCESSIBILITY
# [IMPL-DARK_MODE] [REQ-DARK_MODE] [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI]
# how: Configured light and dark foreground/background pairs exceed WCAG AAA 7:1 contrast.

```
CONTRAST_ACCESSIBILITY(themeConfig):
  INPUT: themeConfig.colors light and dark background/foreground hex values
  OUTPUT: contrast ratios > 7.0 for both modes (light ~13.5:1, dark ~14.7:1 with defaults)
```
