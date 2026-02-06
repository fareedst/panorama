// [REQ-HOME_PAGE] [REQ-BRANDING] [REQ-NAVIGATION_LINKS] [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI]
// Tests for home page component verifying content, branding, navigation,
// and accessibility features. All expected values are driven by configuration.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';
import { getSiteConfig, getThemeConfig, _resetConfigCache } from '../lib/config';

// Reset config cache before each test for isolation
beforeEach(() => {
  _resetConfigCache();
});

// Load config values for assertions
const site = getSiteConfig();
const theme = getThemeConfig();

describe('Home Page [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI]', () => {
  it('renders without errors [IMPL-HOME_PAGE]', () => {
    // [REQ-HOME_PAGE] Basic render test
    render(<Home />);
    expect(screen.getByText(new RegExp(site.content.heading.slice(0, 15), 'i'))).toBeInTheDocument();
  });

  it('displays welcome heading from config [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI] Validates heading comes from site config
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(site.content.heading);
  });

  it('displays descriptive paragraph from config [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-HOME_PAGE] [REQ-CONFIG_DRIVEN_UI] Validates description content is config-driven
    render(<Home />);
    // The description has placeholders replaced with link text, check for surrounding text
    const firstWord = site.content.description.split(/\{/)[0].trim().split(' ').slice(0, 3).join(' ');
    expect(screen.getByText(new RegExp(firstWord, 'i'))).toBeInTheDocument();
  });
});

describe('Branding [REQ-BRANDING] [REQ-CONFIG_DRIVEN_UI]', () => {
  it('renders logo from config [IMPL-IMAGE_OPTIMIZATION] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-BRANDING] [REQ-CONFIG_DRIVEN_UI] Validates logo comes from site config
    render(<Home />);
    const logo = screen.getByAltText(site.branding.logo.alt);
    expect(logo).toBeInTheDocument();
  });

  it('renders button icons from config [IMPL-IMAGE_OPTIMIZATION] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-BRANDING] [REQ-CONFIG_DRIVEN_UI] Validates button icons come from config
    render(<Home />);
    const buttonsWithIcons = site.navigation.buttons.filter(b => b.icon);
    buttonsWithIcons.forEach(button => {
      if (button.icon) {
        const icon = screen.getByAltText(button.icon.alt);
        expect(icon).toBeInTheDocument();
      }
    });
  });

  it('logos have dark mode inversion class when configured [IMPL-IMAGE_OPTIMIZATION] [REQ-DARK_MODE] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-DARK_MODE] [REQ-CONFIG_DRIVEN_UI] Validates dark mode support for images
    render(<Home />);
    if (site.branding.logo.darkInvert) {
      const logo = screen.getByAltText(site.branding.logo.alt);
      expect(logo).toHaveClass('dark:invert');
    }
    site.navigation.buttons.forEach(button => {
      if (button.icon?.darkInvert) {
        const icon = screen.getByAltText(button.icon.alt);
        expect(icon).toHaveClass('dark:invert');
      }
    });
  });
});

describe('Navigation Links [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI]', () => {
  it('contains all inline links from config [IMPL-EXTERNAL_LINKS] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI] Validates inline links from config
    render(<Home />);
    Object.values(site.navigation.inlineLinks).forEach(link => {
      const linkEl = screen.getByRole('link', { name: link.label });
      expect(linkEl).toBeInTheDocument();
      expect(linkEl).toHaveAttribute('href', link.href);
    });
  });

  it('contains all CTA buttons from config [IMPL-EXTERNAL_LINKS] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI] Validates CTA buttons from config
    render(<Home />);
    site.navigation.buttons.forEach(button => {
      const buttonEl = screen.getByRole('link', { name: new RegExp(button.label, 'i') });
      expect(buttonEl).toBeInTheDocument();
      expect(buttonEl).toHaveAttribute('href', button.href);
    });
  });

  it('all external links open in new tab per config [IMPL-EXTERNAL_LINKS] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI] Validates target from config security
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('http')
    );

    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('target', site.navigation.security.target);
    });
  });

  it('all external links have security attributes from config [IMPL-EXTERNAL_LINKS] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-NAVIGATION_LINKS] [REQ-CONFIG_DRIVEN_UI] Validates rel from config security
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('http')
    );

    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('rel', site.navigation.security.rel);
    });
  });

  it('all links include UTM parameters [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates tracking parameters
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('http')
    );

    externalLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      expect(href).toContain('utm_source=create-next-app');
    });
  });
});

describe('Accessibility [REQ-ACCESSIBILITY]', () => {
  it('has proper heading hierarchy [REQ-ACCESSIBILITY]', () => {
    // [REQ-ACCESSIBILITY] Validates semantic heading structure
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('images have descriptive alt text from config [IMPL-IMAGE_OPTIMIZATION] [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI]', () => {
    // [REQ-ACCESSIBILITY] [REQ-CONFIG_DRIVEN_UI] Validates alt text from config
    render(<Home />);
    const logo = screen.getByAltText(site.branding.logo.alt);
    expect(logo).toBeInTheDocument();
    site.navigation.buttons.forEach(button => {
      if (button.icon) {
        const icon = screen.getByAltText(button.icon.alt);
        expect(icon).toBeInTheDocument();
      }
    });
  });

  it('uses semantic main element [REQ-ACCESSIBILITY]', () => {
    // [REQ-ACCESSIBILITY] Validates semantic HTML
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('all links are keyboard accessible [REQ-ACCESSIBILITY]', () => {
    // [REQ-ACCESSIBILITY] Validates links are focusable
    render(<Home />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toBeVisible();
      expect(link).not.toHaveAttribute('tabindex', '-1');
    });
  });
});

describe('Responsive Design [REQ-RESPONSIVE_DESIGN]', () => {
  it('applies responsive classes [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates responsive utility classes
    const { container } = render(<Home />);
    const main = container.querySelector('main');

    // Check for mobile-first responsive classes
    expect(main).toHaveClass('items-center');
    expect(main).toHaveClass('sm:items-start');
  });

  it('button group has responsive layout [IMPL-RESPONSIVE_CLASSES]', () => {
    // [REQ-RESPONSIVE_DESIGN] Validates responsive button layout
    const { container } = render(<Home />);
    const buttonGroup = container.querySelector('.flex.flex-col.sm\\:flex-row');
    expect(buttonGroup).toBeInTheDocument();
  });
});

describe('Dark Mode [REQ-DARK_MODE]', () => {
  it('applies dark mode classes [IMPL-DARK_MODE]', () => {
    // [REQ-DARK_MODE] Validates dark mode utility classes
    const { container } = render(<Home />);

    // Check for elements with dark: prefix classes
    const darkElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkElements.length).toBeGreaterThan(0);
  });
});

describe('Theme Configuration [REQ-CONFIG_DRIVEN_UI]', () => {
  it('uses spacing values from theme config [IMPL-CLASS_OVERRIDES]', () => {
    // [REQ-CONFIG_DRIVEN_UI] Validates spacing is driven by config
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    expect(main).toHaveClass(`py-${theme.spacing.page.paddingY}`);
    expect(main).toHaveClass(`px-${theme.spacing.page.paddingX}`);
  });

  it('uses max-width from theme config [IMPL-CLASS_OVERRIDES]', () => {
    // [REQ-CONFIG_DRIVEN_UI] Validates sizing is driven by config
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    expect(main).toHaveClass(`max-w-${theme.sizing.maxContentWidth}`);
  });
});
