# Podcast PWA

A lightweight Progressive Web App (PWA) for listening to podcasts. This app can be hosted on GitHub Pages and installed on mobile devices for offline podcast listening.

## Features

- Subscribe to your favorite podcasts
- Download episodes for offline playback
- Installable on mobile devices as a PWA
- Lightweight and fast
 - 2x and variable-speed playback (2x required)
 - Basic UI to manage podcast subscriptions (add, remove, list)
 - Playlist support (create, reorder, play queue)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/cmwen/podcast-pwa.git
   cd podcast-pwa
   ```

2. Open `index.html` in your browser or serve it locally.

## Usage

1. Open the app in a supported browser (Chrome, Firefox, Safari).
2. Subscribe to podcasts by entering the RSS feed URL.
3. Download episodes for offline listening.
4. Install the app on your mobile device by tapping "Add to Home Screen" in your browser.

## Deployment to GitHub Pages

1. Push your changes to the `main` branch.
2. Go to your repository settings on GitHub.
3. Scroll to "Pages" and select "Deploy from a branch".
4. Choose `main` as the source branch.
5. Your app will be available at `https://cmwen.github.io/podcast-pwa/`.

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- Service Workers for offline functionality
 - IndexedDB (recommended) for persistent storage

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

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
