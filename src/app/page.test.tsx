// [REQ-HOME_PAGE] [REQ-BRANDING] [REQ-NAVIGATION_LINKS] [REQ-ACCESSIBILITY]
// Tests for home page component verifying content, branding, navigation,
// and accessibility features

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page [REQ-HOME_PAGE]', () => {
  it('renders without errors [IMPL-HOME_PAGE]', () => {
    // [REQ-HOME_PAGE] Basic render test
    render(<Home />);
    expect(screen.getByText(/To get started/i)).toBeInTheDocument();
  });

  it('displays welcome heading [REQ-HOME_PAGE]', () => {
    // [REQ-HOME_PAGE] Validates primary heading content
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('To get started, edit the page.tsx file.');
  });

  it('displays descriptive paragraph [REQ-HOME_PAGE]', () => {
    // [REQ-HOME_PAGE] Validates descriptive content
    render(<Home />);
    expect(screen.getByText(/Looking for a starting point/i)).toBeInTheDocument();
  });
});

describe('Branding [REQ-BRANDING]', () => {
  it('renders Next.js logo [IMPL-IMAGE_OPTIMIZATION]', () => {
    // [REQ-BRANDING] Validates Next.js logo presence
    render(<Home />);
    const logo = screen.getByAltText('Next.js logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders Vercel logo in deploy button [IMPL-IMAGE_OPTIMIZATION]', () => {
    // [REQ-BRANDING] Validates Vercel logo in button
    render(<Home />);
    const vercelLogo = screen.getByAltText('Vercel logomark');
    expect(vercelLogo).toBeInTheDocument();
  });

  it('logos have dark mode inversion class [IMPL-IMAGE_OPTIMIZATION] [REQ-DARK_MODE]', () => {
    // [REQ-DARK_MODE] Validates dark mode support for images
    render(<Home />);
    const nextLogo = screen.getByAltText('Next.js logo');
    const vercelLogo = screen.getByAltText('Vercel logomark');
    expect(nextLogo).toHaveClass('dark:invert');
    expect(vercelLogo).toHaveClass('dark:invert');
  });
});

describe('Navigation Links [REQ-NAVIGATION_LINKS]', () => {
  it('contains Templates link [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates Templates link
    render(<Home />);
    const templatesLink = screen.getByRole('link', { name: 'Templates' });
    expect(templatesLink).toBeInTheDocument();
    expect(templatesLink).toHaveAttribute('href', expect.stringContaining('vercel.com/templates'));
  });

  it('contains Learning Center link [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates Learning link
    render(<Home />);
    const learningLink = screen.getByRole('link', { name: 'Learning' });
    expect(learningLink).toBeInTheDocument();
    expect(learningLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/learn'));
  });

  it('contains Deploy Now button [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates Deploy button
    render(<Home />);
    const deployButton = screen.getByRole('link', { name: /Deploy Now/i });
    expect(deployButton).toBeInTheDocument();
    expect(deployButton).toHaveAttribute('href', expect.stringContaining('vercel.com/new'));
  });

  it('contains Documentation button [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates Documentation button
    render(<Home />);
    const docsButton = screen.getByRole('link', { name: 'Documentation' });
    expect(docsButton).toBeInTheDocument();
    expect(docsButton).toHaveAttribute('href', expect.stringContaining('nextjs.org/docs'));
  });

  it('all external links open in new tab [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates target="_blank" for external links
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter(link => 
      link.getAttribute('href')?.startsWith('http')
    );
    
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('all external links have security attributes [IMPL-EXTERNAL_LINKS]', () => {
    // [REQ-NAVIGATION_LINKS] Validates rel="noopener noreferrer" for security
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter(link => 
      link.getAttribute('href')?.startsWith('http')
    );
    
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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

  it('images have descriptive alt text [IMPL-IMAGE_OPTIMIZATION] [REQ-ACCESSIBILITY]', () => {
    // [REQ-ACCESSIBILITY] Validates alt text for screen readers
    render(<Home />);
    const nextLogo = screen.getByAltText('Next.js logo');
    const vercelLogo = screen.getByAltText('Vercel logomark');
    expect(nextLogo).toBeInTheDocument();
    expect(vercelLogo).toBeInTheDocument();
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
      // Links are focusable by default (no tabIndex=-1)
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
