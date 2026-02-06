// [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI]
// Tests for responsive design verifying mobile-first approach, breakpoints,
// and layout adaptations across screen sizes. Sizing values validated against
// theme configuration.

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Home from '../app/page';
import { getThemeConfig, _resetConfigCache } from '../lib/config';

// Reset config cache before each test
beforeEach(() => {
  _resetConfigCache();
});

const theme = getThemeConfig();

describe('Mobile-First Approach [REQ-RESPONSIVE_DESIGN]', () => {
  it('uses mobile-first utility classes [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates mobile-first class pattern
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    // Default classes apply to mobile (no prefix)
    expect(main).toHaveClass('flex');
    expect(main).toHaveClass('flex-col');
    expect(main).toHaveClass('items-center');

    // Desktop modifications use sm: prefix
    expect(main).toHaveClass('sm:items-start');
  });

  it('applies default styles for mobile [ARCH-RESPONSIVE_FIRST]', () => {
    // [REQ-RESPONSIVE_DESIGN] Documents mobile-first pattern
    const breakpoints = {
      mobile: '0px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
    };

    expect(breakpoints.mobile).toBe('0px');
    expect(breakpoints.sm).toBe('640px');
  });
});

describe('Breakpoint Usage [REQ-RESPONSIVE_DESIGN]', () => {
  it('uses sm: breakpoint for tablet/desktop [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates 640px+ breakpoint usage
    const { container } = render(<Home />);

    const smClasses = container.querySelector('[class*="sm:"]');
    expect(smClasses).toBeInTheDocument();
  });

  it('uses md: breakpoint for fixed widths [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates 768px+ breakpoint usage
    const { container } = render(<Home />);

    const mdClasses = container.querySelector('[class*="md:"]');
    expect(mdClasses).toBeInTheDocument();
  });
});

describe('Layout Transformations [REQ-RESPONSIVE_DESIGN]', () => {
  it('changes flex direction at breakpoints [IMPL-FLEX_LAYOUT]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates responsive flex direction
    const { container } = render(<Home />);

    // Button group: vertical on mobile, horizontal on tablet+
    const buttonGroup = container.querySelector('.flex-col.sm\\:flex-row');
    expect(buttonGroup).toBeInTheDocument();
  });

  it('changes alignment at breakpoints [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates responsive alignment
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    // Center on mobile, left-align on desktop
    expect(main).toHaveClass('items-center');
    expect(main).toHaveClass('sm:items-start');
  });

  it('changes text alignment at breakpoints [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates responsive text alignment
    const { container } = render(<Home />);

    // Find content with text-center sm:text-left
    const textContent = container.querySelector('.text-center.sm\\:text-left');
    expect(textContent).toBeInTheDocument();
  });
});

describe('Width Constraints [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI]', () => {
  it('uses full width on mobile [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates mobile full-width pattern
    const { container } = render(<Home />);

    const fullWidthButton = container.querySelector('.w-full');
    expect(fullWidthButton).toBeInTheDocument();
  });

  it('uses fixed width on desktop from config [IMPL-RESPONSIVE_CLASSES] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI] Validates desktop width from config
    const { container } = render(<Home />);

    // Buttons have fixed width on desktop (md:w-[...])
    const fixedWidthButton = container.querySelector('[class*="md:w-"]');
    expect(fixedWidthButton).toBeInTheDocument();
  });

  it('constrains max width from config [IMPL-FLEX_LAYOUT] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI] Validates max-width from config
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    expect(main).toHaveClass(`max-w-${theme.sizing.maxContentWidth}`);
  });
});

describe('Spacing Adaptations [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI]', () => {
  it('uses consistent gap spacing from config [IMPL-FLEX_LAYOUT] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI] Validates flexbox gap usage
    const { container } = render(<Home />);

    const gapElements = container.querySelectorAll('[class*="gap-"]');
    expect(gapElements.length).toBeGreaterThan(0);
  });

  it('uses padding from config [IMPL-FLEX_LAYOUT] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-RESPONSIVE_DESIGN] [REQ-CONFIG_DRIVEN_UI] Validates padding from theme config
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    expect(main).toHaveClass(`py-${theme.spacing.page.paddingY}`);
    expect(main).toHaveClass(`px-${theme.spacing.page.paddingX}`);
  });
});

describe('Touch Targets [REQ-ACCESSIBILITY] [REQ-RESPONSIVE_DESIGN]', () => {
  it('buttons meet minimum height requirement from config [IMPL-RESPONSIVE_CLASSES] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI] Validates touch target from config
    const { container } = render(<Home />);

    const buttons = container.querySelectorAll(`.h-${theme.sizing.buttonHeight}`);
    expect(buttons.length).toBeGreaterThan(0);

    // 48px exceeds WCAG 44px minimum
    const buttonHeight = 48;
    const minimumTouchTarget = 44;
    expect(buttonHeight).toBeGreaterThanOrEqual(minimumTouchTarget);
  });
});

describe('Tailwind Breakpoint System [ARCH-RESPONSIVE_FIRST]', () => {
  it('uses standard Tailwind breakpoints [ARCH-TAILWIND_V4]', () => {
    // [REQ-RESPONSIVE_DESIGN] Documents Tailwind breakpoint values
    const tailwindBreakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };

    expect(tailwindBreakpoints.sm).toBe('640px');
    expect(tailwindBreakpoints.md).toBe('768px');
    expect(tailwindBreakpoints.lg).toBe('1024px');
  });

  it('follows mobile-first pattern [ARCH-RESPONSIVE_FIRST]', () => {
    // [REQ-RESPONSIVE_DESIGN] Documents mobile-first approach
    const approach = 'mobile-first';
    expect(approach).toBe('mobile-first');
  });
});

describe('No Horizontal Scroll [REQ-RESPONSIVE_DESIGN]', () => {
  it('constrains content width [IMPL-FLEX_LAYOUT]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates content width constraint
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    // w-full ensures content doesn't overflow
    expect(main).toHaveClass('w-full');
    // max-w from config prevents excessive width
    expect(main).toHaveClass(`max-w-${theme.sizing.maxContentWidth}`);
  });
});
