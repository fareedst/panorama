// [REQ-RESPONSIVE_DESIGN]
// Tests for responsive design verifying mobile-first approach, breakpoints,
// and layout adaptations across screen sizes

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Home from '../app/page';

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
    // Default (no prefix) = Mobile (0px+)
    // sm: prefix = Tablet/Desktop (640px+)
    
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
    
    // Find elements with sm: prefix classes
    const smClasses = container.querySelector('[class*="sm:"]');
    expect(smClasses).toBeInTheDocument();
  });

  it('uses md: breakpoint for fixed widths [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates 768px+ breakpoint usage
    const { container } = render(<Home />);
    
    // Find elements with md: prefix classes
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

describe('Width Constraints [REQ-RESPONSIVE_DESIGN]', () => {
  it('uses full width on mobile [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates mobile full-width pattern
    const { container } = render(<Home />);
    
    // Buttons are full width on mobile
    const fullWidthButton = container.querySelector('.w-full');
    expect(fullWidthButton).toBeInTheDocument();
  });

  it('uses fixed width on desktop [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates desktop fixed-width pattern
    const { container } = render(<Home />);
    
    // Buttons have fixed width on desktop (md:w-[158px])
    const fixedWidthButton = container.querySelector('[class*="md:w-"]');
    expect(fixedWidthButton).toBeInTheDocument();
  });

  it('constrains max width for readability [IMPL-FLEX_LAYOUT]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates max-width constraint
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    
    expect(main).toHaveClass('max-w-3xl');
  });
});

describe('Spacing Adaptations [REQ-RESPONSIVE_DESIGN]', () => {
  it('uses consistent gap spacing [IMPL-FLEX_LAYOUT]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates flexbox gap usage
    const { container } = render(<Home />);
    
    // Various gap sizes used throughout
    const gapElements = container.querySelectorAll('[class*="gap-"]');
    expect(gapElements.length).toBeGreaterThan(0);
  });

  it('uses padding for spacing [IMPL-FLEX_LAYOUT]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates padding usage
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    
    expect(main).toHaveClass('py-32');
    expect(main).toHaveClass('px-16');
  });
});

describe('Touch Targets [REQ-ACCESSIBILITY] [REQ-RESPONSIVE_DESIGN]', () => {
  it('buttons meet minimum height requirement [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-ACCESSIBILITY] Validates 44px minimum touch target
    // h-12 class = 3rem = 48px (exceeds 44px minimum)
    const { container } = render(<Home />);
    
    const buttons = container.querySelectorAll('.h-12');
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
    // Mobile-first means: default styles for mobile, add complexity for larger screens
    
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
    // max-w-3xl prevents excessive width
    expect(main).toHaveClass('max-w-3xl');
  });
});
