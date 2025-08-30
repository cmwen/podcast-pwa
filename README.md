# Podcast PWA

A lightweight Progressive Web App (PWA) for listening to podcasts. Built with modern web technologies and automated deployment to GitHub Pages.

## Features

- 🎧 Subscribe to your favorite podcasts via RSS feeds
- 📱 Download episodes for offline playback
- 🚀 Installable on mobile devices as a PWA
- ⚡ Lightweight and fast (<1.5s load time)
- 🎮 Variable-speed playback (0.5x to 2x)
- 📋 Playlist management with drag-drop reordering
- 🔄 Background sync for seamless offline experience
- 🎨 Mobile-first responsive design

## Technology Stack

### Frontend

- **Preact + TypeScript** - Lightweight React alternative with type safety
- **Vite** - Fast build tool optimized for modern web development
- **Preact Signals** - Reactive state management
- **CSS3** - Custom properties and modern layout (Grid/Flexbox)

### PWA Infrastructure

- **Vite PWA Plugin** - Automated service worker with Workbox
- **IndexedDB** - Client-side storage for subscriptions and episodes
- **Cache API** - Offline audio file storage

### Data & Parsing

- **fast-xml-parser** - RSS/Atom feed parsing
- **SortableJS** - Touch-friendly drag & drop
- **idb** - Promise-based IndexedDB wrapper

### Development & Testing

- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing across browsers
- **ESLint + Prettier** - Code quality and formatting
- **Lighthouse CI** - Performance and PWA compliance

## Installation & Development

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/cmwen/podcast-pwa.git
   cd podcast-pwa
   pnpm install
   ```

2. **Start development server:**

   ```bash
   pnpm run dev
   ```

3. **Build for production:**

   ```bash
   pnpm run build
   ```

4. **Preview production build:**
   ```bash
   pnpm run preview
   ```

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

## Deployment

### Automatic Deployment (Recommended)

The project includes GitHub Actions for automated deployment to GitHub Pages:

1. Push changes to the `main` branch
2. GitHub Actions automatically builds and deploys
3. App available at `https://cmwen.github.io/podcast-pwa/`

### Manual Deployment

```bash
pnpm run build
# Deploy the `dist/` folder to your hosting provider
```

## Project Structure

```
src/
├── components/          # Preact components
│   ├── views/          # Page-level components
│   ├── App.tsx         # Main app component
│   └── Navigation.tsx  # Navigation component
├── services/           # Business logic
│   ├── storage.ts      # IndexedDB operations
│   └── rss.ts         # RSS feed parsing
├── types/             # TypeScript definitions
├── styles/            # CSS stylesheets
└── main.tsx          # Application entry point
```

## Contributing

### Execution Agent Workflow

This project follows an **Execution Agent** development approach with strict traceability between Product backlog → Design → Execution → QA.

#### Development Principles

- **Confirm assumptions first** - Always validate design decisions before implementation
- **Suggest alternatives** - Propose implementation options when requirements are ambiguous
- **Highlight risks** - Flag performance, scalability, or maintainability concerns
- **Test coverage** - Always provide test scaffolding alongside implementation

#### Commit Conventions

Use these tags for traceability:

- **[Execution → QA]** - Implementation ready for QA testing
- **[Design → Execution]** - Implementation of specific design decision
- **[Backlog → Execution]** - Implementation of backlog item
- **[Technical Debt]** - Refactoring or improvement work

#### Documentation Requirements

1. **Update `/docs/execution_log.md`** for each feature implemented
2. **Link to design decisions** in `/docs/design.md`
3. **Reference backlog items** from `/docs/vision.md`
4. **Include test suggestions** following `/docs/test_scaffolding.md`

#### Implementation Standards

- Mobile-first responsive design
- PWA compliance (offline-capable, installable)
- Performance budget: <1.5s load time, <50KB app shell
- Accessibility: WCAG 2.1 AA compliance
- Cross-browser compatibility: Chrome, Firefox, Safari
- TypeScript strict mode for type safety

### Quality Assurance

The project maintains high quality standards through:

- **Automated testing** - Unit tests (Vitest) + E2E tests (Playwright)
- **Performance monitoring** - Lighthouse CI with performance budgets
- **Code quality** - ESLint + Prettier with strict TypeScript
- **PWA compliance** - Automated PWA validation in CI pipeline

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
