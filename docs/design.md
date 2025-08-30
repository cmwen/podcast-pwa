# Design Documentation — Podcast PWA

## Design Agent Framework

This document serves as the central hub for all design decisions, architecture choices, and traceability between product requirements and technical implementation.

---

## Architecture Overview

### System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                    Podcast PWA                             │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Mobile-First)                                   │
│  ├── Subscription Manager                                  │
│  ├── Episode List & Player                                 │
│  ├── Playlist Manager                                      │
│  └── Settings & Controls                                   │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                             │
│  ├── RSS Feed Parser                                       │
│  ├── Download Manager                                      │
│  ├── Playback Engine                                       │
│  └── Sync Controller                                       │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── IndexedDB (Subscriptions, Episodes, Playlists)       │
│  ├── Cache API (Downloaded Audio Files)                   │
│  └── LocalStorage (Settings, UI State)                    │
├─────────────────────────────────────────────────────────────┤
│  PWA Infrastructure                                        │
│  ├── Service Worker (Offline Support)                     │
│  ├── Web App Manifest                                      │
│  └── Background Sync                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Design Matrix

### Traceability: Product Backlog → Design → Execution → QA

| **Product Requirement**               | **Design Decision**                                                   | **Technical Implementation**                  | **QA Considerations**                                         |
| ------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| RSS Subscription Management           | [Design → Execution] Centralized subscription store with validation   | IndexedDB schema + RSS parser module          | **[Design → QA]** Test invalid RSS feeds, network failures    |
| Offline Episode Playback              | [Design → Execution] Cache API for audio + metadata sync              | Service Worker caching strategy               | **[Design → QA]** Verify playback without network             |
| Variable Speed Playback (2x required) | [Design → Execution] HTML5 Audio API wrapper with persistent settings | Custom audio controller with speed state      | **[Design → QA]** Cross-browser speed accuracy testing        |
| Playlist Management                   | [Design → Execution] Drag-drop reorder + persistent queue state       | React/Vanilla JS drag handlers + IndexedDB    | **[Design → QA]** Test reorder persistence across sessions    |
| Mobile-First UI                       | [Design → Execution] Progressive enhancement from mobile breakpoints  | CSS Grid/Flexbox with touch-friendly controls | **[Design → QA]** Touch interaction testing on actual devices |

---

## Detailed Design Decisions

### 1. Subscription Management Design

**Requirement Trace:** RSS subscription by URL with basic subscription list UI (MVP Scope)

**Design Approaches Considered:**

1. **Cloud-sync subscriptions** (Rejected: Against privacy-first vision)
2. **Local-only with export/import** (Selected: Aligns with local-first approach)

**Trade-offs:**

- ✅ **Pro:** Complete user privacy, no account required
- ❌ **Con:** No cross-device sync (acceptable for MVP)
- ⚠️ **Risk:** Data loss if browser storage cleared

**Implementation Notes:**

```
IndexedDB Schema:
subscriptions: {
  id: string (UUID),
  title: string,
  url: string (RSS feed),
  description: string,
  lastFetched: timestamp,
  episodeCount: number
}
```

**[Design → Execution]** Implement RSS parser with error handling for malformed feeds
**[Design → QA]** Test subscription persistence across browser sessions

---

### 2. Offline Playback Architecture

**Requirement Trace:** Download episodes for offline listening (Core Feature)

**Design Approaches Considered:**

1. **Blob URLs in memory** (Rejected: Memory constraints on mobile)
2. **Cache API with Service Worker** (Selected: PWA standard, efficient)

**Trade-offs:**

- ✅ **Pro:** Efficient storage, automatic cleanup, PWA compliant
- ❌ **Con:** Complexity in cache invalidation
- ⚠️ **Risk:** Storage quota limits on some devices

**Sequence Flow:**

```
User → Download Request → Download Manager → Fetch Audio
  ↓
Cache API ← Service Worker ← Response Stream
  ↓
IndexedDB (metadata) ← Episode Status Update
  ↓
UI Update (Download Complete)
```

**[Design → Execution]** Implement background download with progress tracking
**[Design → QA]** Test download interruption and resume scenarios

---

### 3. Playlist Management UX

**Requirement Trace:** Playlist creation, reorder, and persistent queue (MVP Scope)

**Design Approaches Considered:**

1. **Simple FIFO queue** (Too limiting for user control)
2. **Full playlist editor with drag-drop** (Selected: Better UX)

**UI Flow Design:**

```
Playlist Screen
├── Create New Playlist [+]
├── My Playlists
│   ├── [Queue] (Special auto-playlist)
│   ├── [Favorites]
│   └── [Custom Playlist 1]
└── Episode Actions
    ├── Add to Playlist
    ├── Add to Queue
    └── Play Next
```

**[Design → Execution]** Use touch-friendly drag handles with haptic feedback
**[Design → QA]** Test playlist reorder accuracy across mobile browsers

---

### 4. Performance & Storage Strategy

**Requirement Trace:** App initial load under 1.5s on mobile (Success Metrics)

**Design Approaches Considered:**

1. **Single-page monolith** (Risk: Large initial bundle)
2. **Module-based lazy loading** (Selected: Better performance)

**Resource Loading Strategy:**

```
Critical Path:
├── App Shell (HTML/CSS/Core JS) < 50KB
├── Service Worker Registration
└── IndexedDB Initialization

Lazy Loaded:
├── RSS Parser (on first subscription)
├── Audio Engine (on first playback)
└── Playlist Editor (on playlist access)
```

**Storage Allocation:**

- **IndexedDB:** Subscriptions, episodes metadata, playlists (~1-5MB)
- **Cache API:** Downloaded audio files (~100MB default quota)
- **LocalStorage:** User preferences, UI state (~1MB)

**[Design → Execution]** Implement progressive loading with skeleton screens
**[Design → QA]** Performance testing on 3G networks and low-end devices

---

## Data Models

### Core Entities

```typescript
interface Subscription {
  id: string
  title: string
  url: string
  description?: string
  imageUrl?: string
  lastFetched: Date
  isActive: boolean
}

interface Episode {
  id: string
  subscriptionId: string
  title: string
  description: string
  audioUrl: string
  duration: number
  publishDate: Date
  downloadStatus: 'none' | 'downloading' | 'downloaded' | 'error'
  playbackPosition: number // seconds
}

interface Playlist {
  id: string
  name: string
  episodeIds: string[]
  isQueue: boolean // Special flag for main queue
  createdAt: Date
  updatedAt: Date
}
```

---

## Mobile-First Design Patterns

### Touch Interaction Design

**Requirement Trace:** Installable on mobile devices as a PWA (Core Feature)

**Touch Target Standards:**

- Minimum 44px tap targets (iOS guideline)
- 8px spacing between interactive elements
- Swipe gestures for playlist reordering
- Pull-to-refresh for subscription updates

**Responsive Breakpoints:**

```css
/* Mobile First */
@media (min-width: 320px) {
  /* Small mobile */
}
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop */
}
```

**[Design → Execution]** Use CSS custom properties for consistent spacing
**[Design → QA]** Test on physical devices, not just browser dev tools

---

## Service Worker Strategy

**Requirement Trace:** Service Workers for offline functionality (Technologies)

**Caching Strategy:**

1. **App Shell:** Cache-first with network fallback
2. **RSS Feeds:** Network-first with cache fallback
3. **Audio Files:** Cache-only (explicitly downloaded)
4. **Images:** Stale-while-revalidate

**Background Sync Design:**

```
User goes offline → Queue RSS updates → Return online → Sync pending updates
```

**[Design → Execution]** Implement selective caching to manage storage quota
**[Design → QA]** Test offline/online transition scenarios

---

## Risk Analysis & Mitigation

### Technical Risks

| **Risk**                        | **Impact** | **Probability** | **Mitigation**                               |
| ------------------------------- | ---------- | --------------- | -------------------------------------------- |
| Browser storage quota exceeded  | High       | Medium          | Implement storage management + user warnings |
| RSS feed parsing failures       | Medium     | High            | Robust error handling + user feedback        |
| Audio playback inconsistencies  | High       | Medium          | Feature detection + fallback controls        |
| Service Worker update conflicts | Medium     | Low             | Versioned SW with graceful updates           |

### UX Risks

| **Risk**                             | **Impact** | **Mitigation**                                  |
| ------------------------------------ | ---------- | ----------------------------------------------- |
| Complex playlist UX on small screens | Medium     | Progressive disclosure + simplified mobile flow |
| Download progress unclear            | Low        | Clear progress indicators + status messaging    |
| Offline state confusion              | High       | Prominent offline indicators + sync status      |

---

## Future-Proofing Considerations

### Extensibility Hooks

**Question: "Is this design future-proof?"**

1. **Subscription Sources:** Designed for RSS, extensible to other feed types
2. **Audio Formats:** HTML5 Audio API supports format expansion
3. **Sync Mechanisms:** Local-first with export hooks for future cloud sync
4. **UI Framework:** Modular components for easy framework migration

### Technology Evolution

**Potential Additions:**

- WebRTC for podcast recommendations sharing
- Background fetch for larger downloads
- Web Speech API for voice controls
- Push notifications for new episodes

**[Design → Execution]** Use dependency injection for service implementations
**[Design → QA]** Design tests that verify extensibility points

---

## Design Review Checklist

### Pre-Implementation Review

- [ ] Requirement traced to product backlog item
- [ ] At least two implementation approaches considered
- [ ] Trade-offs documented with pros/cons
- [ ] Mobile-first interaction patterns defined
- [ ] Storage and performance implications calculated
- [ ] Cross-browser compatibility verified
- [ ] Accessibility considerations included

### Post-Implementation Review

- [ ] Design decisions match implementation
- [ ] Performance targets met
- [ ] QA risks identified and addressed
- [ ] Future extensibility validated
- [ ] User testing feedback incorporated

---

## Change Log

| **Date**   | **Change**               | **Rationale**                            | **Impact**                                             |
| ---------- | ------------------------ | ---------------------------------------- | ------------------------------------------------------ |
| 2025-08-30 | Initial design framework | Establish design documentation structure | **[Design → Execution]** Foundation for implementation |

---

**Next Design Sprint:** Detailed wireframes for subscription management UI and playlist editor

---

## Tech Stack Recommendations

Below are two recommended technology stacks aligned to this design: a recommended (DX + performance) stack for a modern, small PWA, and an ultra-minimal, zero-deps variant for single-file or GitHub Pages-first deployments.

Recommended stack (DX + performance)

- App framework: Preact + TypeScript (small, React-compatible)
- Bundler/dev: Vite (fast builds, easy GH Pages output)
- Styling: Tailwind CSS (JIT) or vanilla CSS with CSS custom properties
- State: Preact signals or nanostores for lightweight reactivity
- Data layer: idb (IndexedDB wrapper) for subscriptions/episodes/playlists
- RSS parsing: fast-xml-parser (browser-friendly) with an optional small CORS proxy
- Drag & drop: SortableJS (touch-friendly)
- Audio: native HTMLAudioElement wrapped in a thin controller for rate/position persistence
- PWA tooling: Workbox for SW generation + web app manifest
- Testing: Vitest (unit), Playwright (e2e/offline/mobile), Lighthouse CI (performance/PWA budgets)
- Lint/format: ESLint + Prettier, TypeScript strict mode

Why this aligns with the design

- Small, fast, and PWA-first; supports lazy-loading and small app shell.
- Matches Service Worker Strategy, Performance & Storage, and Playlist UX in this doc.

Trade-offs

- Slightly more setup than vanilla but much better DX and testability.
- Optional CORS proxy is a small serverless dependency for feeds that block CORS.

Ultra-minimal stack (no-build, zero-deps bias)

- Vanilla ES modules + small TypeScript compilation (optional)
- Styling: vanilla CSS with custom properties
- Data: idb-keyval or a small idb wrapper vendored in
- RSS parsing: fast-xml-parser vendored as an ESM module
- Drag & drop: SortableJS ESM or native HTML5 Drag & Drop (touch polyfill)
- PWA: hand-written Service Worker + manifest

Trade-offs

- Minimal footprint and simple GH Pages hosting.
- More manual wiring, fewer developer ergonomics.

Optional add-ons

- Accessibility: axe in Playwright; keyboard navigation patterns
- Analytics: privacy-friendly local metrics only
- CI: GitHub Actions for build/test/deploy and Lighthouse CI

Key assumptions & risks

- Many RSS feeds block CORS; a tiny CORS proxy (Cloudflare Worker) is likely needed for a seamless experience.
- Storage quotas vary by platform; implement eviction and clear user messaging.
