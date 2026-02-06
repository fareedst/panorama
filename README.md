# Next.js Application with STDD Methodology

**Version**: 0.1.0  
**Last Updated**: 2026-02-06

A modern Next.js application built with React 19, TypeScript, and Tailwind CSS v4, following **Semantic Token-Driven Development (STDD)** methodology for complete traceability from requirements through implementation.

## 🚀 Features

- **Next.js 16.1** with App Router and React Server Components
- **React 19.2** with modern concurrent features
- **TypeScript 5.x** with strict mode for type safety
- **Tailwind CSS v4** with mobile-first responsive design
- **Dark Mode** with automatic system preference detection
- **Optimized Fonts** using next/font with Geist Sans & Geist Mono
- **STDD Documentation** with full requirements traceability
- **Comprehensive Testing** with Vitest and React Testing Library (66 tests)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or later (LTS recommended)
- **npm**: v9.x or later (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version  # Should be v18.17+
npm --version   # Should be v9.x+
```

## 🛠️ Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd nx1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all production and development dependencies including:
   - Next.js, React, and React DOM
   - TypeScript and type definitions
   - Tailwind CSS v4 and PostCSS
   - Vitest and React Testing Library
   - ESLint for code quality

3. **Verify installation**:
   ```bash
   npm run lint  # Should complete without errors
   ```

## 🔨 Development Workflow

### Starting Development Server

Run the development server with hot reload:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

The page auto-updates as you edit files. Changes to `src/app/page.tsx` will be reflected immediately.

### Development Best Practices

1. **Follow STDD Methodology**:
   - Document requirements in `stdd/requirements.md` with `[REQ-*]` tokens
   - Record architecture decisions in `stdd/architecture-decisions/` with `[ARCH-*]` tokens
   - Document implementations in `stdd/implementation-decisions/` with `[IMPL-*]` tokens
   - Update `stdd/semantic-tokens.md` registry

2. **Write Tests First**:
   - Create tests that reference requirements: `[REQ-*]` in test names
   - Run tests in watch mode: `npm run test:watch`
   - Ensure all tests pass before committing

3. **Code Quality**:
   - Run linter before commits: `npm run lint`
   - Add semantic token comments to code
   - Maintain type safety with TypeScript

## 🧪 Testing

### Running Tests

The project uses **Vitest** with **React Testing Library** for comprehensive testing.

**Run all tests once**:
```bash
npm test
```

**Run tests in watch mode** (recommended during development):
```bash
npm run test:watch
```

**Generate coverage report**:
```bash
npm run test:coverage
```

### Test Coverage

**Current Status**: 66 tests, all passing ✅

**Coverage**: 100% for application code (`src/app/`)
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

View detailed coverage report:
```bash
npm run test:coverage
open coverage/index.html  # View HTML report
```

### Test Structure

Tests are organized by feature and include semantic token references:

```
src/
├── app/
│   ├── layout.test.tsx        # Layout, fonts, metadata tests
│   └── page.test.tsx          # Home page, navigation, accessibility
└── test/
    ├── dark-mode.test.tsx     # Dark mode functionality
    ├── responsive.test.tsx    # Responsive design
    └── integration/
        └── app.test.tsx       # Full application integration
```

### Test Categories

- **Component Tests**: Layout, page, and UI component testing
- **Integration Tests**: Full application rendering and interaction
- **Accessibility Tests**: WCAG compliance and screen reader support
- **Responsive Tests**: Mobile-first design validation
- **Dark Mode Tests**: Theme switching and contrast ratios

**For detailed testing documentation**, see **[TESTING.md](TESTING.md)**

## 🏗️ Building for Production

### Build Process

Create an optimized production build:

```bash
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Optimizes React components with React Compiler
3. Generates static pages where possible
4. Optimizes images, fonts, and CSS
5. Creates minified bundles with code splitting
6. Outputs to `.next/` directory

**Build output includes**:
- Optimized JavaScript bundles (code-split per route)
- Static HTML pages (pre-rendered)
- Optimized images (WebP/AVIF)
- CSS with unused styles purged
- Font files (WOFF2, self-hosted)

### Testing the Production Build

Start the production server locally:

```bash
npm run build    # Build first
npm start        # Start production server
```

The production server runs at http://localhost:3000

**Verify production build**:
- Check page load performance (should be fast)
- Test dark mode switching (should be instant)
- Verify all links work correctly
- Check responsive design on different screen sizes

## 🚢 Deployment

### Deployment Options

#### Option 1: Vercel (Recommended)

**Deploy with one click**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nx1)

**Or deploy via CLI**:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts to configure your deployment

**Vercel Features**:
- Automatic deployments on git push
- Preview deployments for pull requests
- Edge network with CDN
- Automatic HTTPS
- Environment variable management
- Analytics and monitoring

#### Option 2: Docker

**Build Docker image**:

```bash
docker build -t nx1-app .
```

**Run container**:

```bash
docker run -p 3000:3000 nx1-app
```

**Note**: Create a `Dockerfile` following [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker).

#### Option 3: Static Export

For static hosting (Netlify, GitHub Pages, etc.):

1. Update `next.config.ts`:
   ```typescript
   const config = {
     output: 'export',
     // ... other config
   };
   ```

2. Build static files:
   ```bash
   npm run build
   ```

3. Deploy the `out/` directory to your static host

**Note**: Static export has limitations (no server-side features).

#### Option 4: Self-Hosted Node.js

Deploy to any Node.js hosting:

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload files to your server:
   - `.next/` directory
   - `public/` directory
   - `package.json`
   - `package-lock.json`

3. Install dependencies on server:
   ```bash
   npm install --production
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Use a process manager (PM2, systemd) for production

### Environment Variables

Create `.env.local` for local development:

```bash
# Example environment variables
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Add your environment variables here
```

**For production**, set environment variables in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Docker: Use `-e` flag or docker-compose
- Self-hosted: System environment or .env file

**Security Note**: Never commit `.env.local` or `.env` files with secrets!

## 📁 Project Structure

```
nx1/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Root layout [IMPL-ROOT_LAYOUT]
│   │   ├── page.tsx              # Home page [IMPL-HOME_PAGE]
│   │   ├── globals.css           # Global styles [IMPL-DARK_MODE]
│   │   └── *.test.tsx            # Component tests
│   └── test/                     # Test utilities and tests
│       ├── setup.ts              # Test configuration
│       ├── utils.tsx             # Test helpers
│       └── *.test.tsx            # Feature tests
├── public/                       # Static assets
│   ├── next.svg                  # Next.js logo
│   ├── vercel.svg                # Vercel logo
│   └── *.svg                     # Other static files
├── stdd/                         # STDD Documentation
│   ├── requirements.md           # Requirements [REQ-*]
│   ├── architecture-decisions.md # Architecture index
│   ├── architecture-decisions/   # Detailed decisions [ARCH-*]
│   ├── implementation-decisions.md # Implementation index
│   ├── implementation-decisions/ # Detailed implementations [IMPL-*]
│   ├── semantic-tokens.md        # Token registry
│   └── tasks.md                  # Task tracking
├── .gitignore                    # Git ignore rules
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.ts              # Vitest test configuration
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint to check code quality

### Testing
- `npm test` - Run all tests once (CI mode)
- `npm run test:watch` - Run tests in watch mode (development)
- `npm run test:coverage` - Generate test coverage report

### Production
- `npm run build` - Create optimized production build
- `npm start` - Start production server (requires build first)

### Script Details

| Script | Command | Description | Use Case |
|--------|---------|-------------|----------|
| `dev` | `next dev` | Starts dev server with Fast Refresh | Development |
| `build` | `next build` | Creates optimized production build | Pre-deployment |
| `start` | `next start` | Serves production build | Production |
| `lint` | `eslint` | Checks code quality and style | Before commit |
| `test` | `vitest` | Runs tests in CI mode | CI/CD pipeline |
| `test:watch` | `vitest --watch` | Runs tests on file changes | Development |
| `test:coverage` | `vitest --coverage` | Generates coverage report | Code review |

## 🎨 Technology Stack

### Core Framework
- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library with Server Components
- **TypeScript 5.x** - Type-safe JavaScript

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **PostCSS** - CSS transformation tool
- **CSS Custom Properties** - For theming (dark mode)

### Fonts
- **next/font/google** - Optimized font loading
- **Geist Sans** - Primary sans-serif font
- **Geist Mono** - Monospace font for code

### Testing
- **Vitest 2.1.8** - Fast test runner with jsdom
- **React Testing Library 16.1.0** - Component testing utilities
- **@testing-library/jest-dom** - Custom matchers
- **jsdom 25.0.1** - DOM implementation for Node.js

### Development Tools
- **ESLint** - Code linting with Next.js rules
- **TypeScript Compiler** - Type checking
- **React Compiler** - Optimizing compiler (babel plugin)

## 📚 STDD Methodology

This project follows **Semantic Token-Driven Development (STDD) v1.3.0**.

### What is STDD?

STDD creates a traceable chain of intent from requirements to code:

```
[REQ-*] → [ARCH-*] → [IMPL-*] → Code → Tests
```

**Every feature includes**:
1. **Requirement** (`[REQ-*]`) - WHAT and WHY
2. **Architecture Decision** (`[ARCH-*]`) - HOW (high-level)
3. **Implementation Decision** (`[IMPL-*]`) - HOW (detailed)
4. **Code** - With semantic token comments
5. **Tests** - Validating the requirement

### Documentation

All STDD documentation is in the `stdd/` directory:

- **[Requirements](stdd/requirements.md)** - 14 documented requirements
- **[Architecture Decisions](stdd/architecture-decisions.md)** - 11 decision files
- **[Implementation Decisions](stdd/implementation-decisions.md)** - 9 implementation files
- **[Semantic Tokens](stdd/semantic-tokens.md)** - 34 token registry
- **[Tasks](stdd/tasks.md)** - Task tracking with priorities

### For Developers

When adding new features:

1. **Document the requirement** in `stdd/requirements.md` with `[REQ-*]` token
2. **Record architecture decision** in `stdd/architecture-decisions/`
3. **Document implementation** in `stdd/implementation-decisions/`
4. **Add semantic token comments** to your code
5. **Write tests** that reference the `[REQ-*]` token
6. **Update** `stdd/semantic-tokens.md` registry

See `stdd/AGENTS.md` and `ai-principles.md` for complete guidelines.

## 🔍 Code Quality

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

**ESLint checks**:
- Next.js best practices
- React hooks rules
- TypeScript type usage
- Code style consistency
- Potential bugs

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

### Type Checking

TypeScript is configured with strict mode:

```bash
npx tsc --noEmit  # Type check without building
```

### Pre-Commit Checklist

Before committing code:
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Code has semantic token comments
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for releases)

## 🌐 Browser Support

This application supports modern browsers:

- **Chrome/Edge**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Mobile browsers**: iOS Safari 13+, Android Chrome

**ES2017+ features are used**, which excludes:
- Internet Explorer (all versions)
- Very old browser versions

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use**:
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Build fails with TypeScript errors**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Tests fail with module errors**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Dark mode not working**:
- Check browser DevTools → Application → Appearance
- Verify system dark mode is enabled
- Check browser cache (try hard refresh: Ctrl+Shift+R)

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please follow the STDD methodology:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Document requirement in `stdd/requirements.md`
4. Implement with semantic token comments
5. Write tests with `[REQ-*]` references
6. Update documentation
7. Commit: `git commit -m "feat: add feature [REQ-MY_FEATURE]"`
8. Push: `git push origin feature/my-feature`
9. Create a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📞 Support

- **Documentation**: See `stdd/` directory for complete documentation
- **Issues**: [GitHub Issues](https://github.com/yourusername/nx1/issues)
- **Next.js Docs**: https://nextjs.org/docs
- **STDD Methodology**: See `ai-principles.md` and `AGENTS.md`

## 🔗 Links

- **Next.js**: https://nextjs.org
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
- **Vitest**: https://vitest.dev
- **Vercel**: https://vercel.com

---

**Built with ❤️ using Next.js, React, and STDD Methodology**

*Version 0.1.0 - Initial STDD Documentation Baseline*
