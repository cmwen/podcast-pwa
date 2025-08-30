/**
 * Podcast PWA - Main Application
 * [Design → Execution] App Shell with progressive loading
 * Implements mobile-first PWA architecture with lazy-loaded modules
 */

// App State Management
class AppState {
    constructor() {
        this.currentView = 'subscriptions';
        this.isOnline = navigator.onLine;
        this.serviceWorkerSupported = 'serviceWorker' in navigator;
    }

    setState(key, value) {
        this[key] = value;
        this.notifyStateChange(key, value);
    }

    notifyStateChange(key, value) {
        // Emit custom events for state changes
        window.dispatchEvent(new CustomEvent('app-state-change', {
            detail: { key, value }
        }));
    }
}

// Main App Class
class PodcastApp {
    constructor() {
        this.state = new AppState();
        this.modules = new Map(); // Lazy-loaded modules cache
        this.init();
    }

    async init() {
        console.log('[Execution] Initializing Podcast PWA...');
        
        // Register service worker first
        await this.registerServiceWorker();
        
        // Initialize UI
        this.initializeUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize storage
        await this.initializeStorage();
        
        console.log('[Execution] App initialization complete');
    }

    /**
     * [Design → Execution] Service Worker registration for offline functionality
     */
    async registerServiceWorker() {
        if (!this.state.serviceWorkerSupported) {
            console.warn('[Execution] Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[Execution] Service Worker registered:', registration.scope);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                console.log('[Execution] Service Worker update found');
            });
        } catch (error) {
            console.error('[Execution] Service Worker registration failed:', error);
        }
    }

    /**
     * Initialize UI components and navigation
     */
    initializeUI() {
        // Setup navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewId = e.target.id.replace('nav-', '');
                this.navigateToView(viewId);
            });
        });

        // Setup initial view
        this.showView(this.state.currentView);
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Network status monitoring
        window.addEventListener('online', () => {
            this.state.setState('isOnline', true);
            console.log('[Execution] App is online');
        });

        window.addEventListener('offline', () => {
            this.state.setState('isOnline', false);
            console.log('[Execution] App is offline');
        });

        // App state changes
        window.addEventListener('app-state-change', (e) => {
            this.handleStateChange(e.detail.key, e.detail.value);
        });

        // Add subscription button
        document.getElementById('add-subscription')?.addEventListener('click', () => {
            this.handleAddSubscription();
        });

        // Create playlist button
        document.getElementById('create-playlist')?.addEventListener('click', () => {
            this.handleCreatePlaylist();
        });
    }

    /**
     * [Design → Execution] Initialize IndexedDB storage
     */
    async initializeStorage() {
        try {
            // This will be implemented with the storage module
            console.log('[Execution] Storage initialization placeholder');
            // TODO: Load StorageManager module and initialize IndexedDB
        } catch (error) {
            console.error('[Execution] Storage initialization failed:', error);
        }
    }

    /**
     * Navigate between views with lazy loading
     */
    async navigateToView(viewId) {
        console.log(`[Execution] Navigating to view: ${viewId}`);
        
        // Update navigation state
        this.updateNavigation(viewId);
        
        // Show view
        this.showView(viewId);
        
        // Lazy load module if needed
        await this.loadViewModule(viewId);
        
        this.state.setState('currentView', viewId);
    }

    /**
     * Update navigation UI
     */
    updateNavigation(activeView) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const viewId = btn.id.replace('nav-', '');
            btn.classList.toggle('active', viewId === activeView);
        });
    }

    /**
     * Show/hide views
     */
    showView(viewId) {
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            const isActive = view.id === `${viewId}-view`;
            view.classList.toggle('active', isActive);
        });
    }

    /**
     * [Design → Execution] Lazy load modules for better performance
     */
    async loadViewModule(viewId) {
        if (this.modules.has(viewId)) {
            return this.modules.get(viewId);
        }

        try {
            let module;
            switch (viewId) {
                case 'subscriptions':
                    // module = await import('./modules/subscriptions.js');
                    console.log('[Execution] Subscriptions module loading placeholder');
                    break;
                case 'player':
                    // module = await import('./modules/player.js');
                    console.log('[Execution] Player module loading placeholder');
                    break;
                case 'playlists':
                    // module = await import('./modules/playlists.js');
                    console.log('[Execution] Playlists module loading placeholder');
                    break;
                default:
                    console.warn(`[Execution] Unknown view module: ${viewId}`);
                    return;
            }

            this.modules.set(viewId, module);
            return module;
        } catch (error) {
            console.error(`[Execution] Failed to load module for ${viewId}:`, error);
        }
    }

    /**
     * Handle state changes
     */
    handleStateChange(key, value) {
        switch (key) {
            case 'isOnline':
                this.updateOnlineStatus(value);
                break;
            default:
                console.log(`[Execution] State change: ${key} = ${value}`);
        }
    }

    /**
     * Update UI based on online status
     */
    updateOnlineStatus(isOnline) {
        // Add visual indicator for offline state
        // This could be implemented as a status bar or notification
        console.log(`[Execution] Online status: ${isOnline}`);
    }

    /**
     * Handle add subscription action
     */
    async handleAddSubscription() {
        console.log('[Execution] Add subscription triggered');
        
        // Show loading state
        this.showLoading(true);
        
        try {
            // This will be implemented with the subscriptions module
            const rssUrl = prompt('Enter RSS feed URL:');
            if (rssUrl) {
                console.log(`[Execution] Adding subscription: ${rssUrl}`);
                // TODO: Validate and add RSS feed
            }
        } catch (error) {
            console.error('[Execution] Add subscription failed:', error);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle create playlist action
     */
    async handleCreatePlaylist() {
        console.log('[Execution] Create playlist triggered');
        
        try {
            const playlistName = prompt('Enter playlist name:');
            if (playlistName) {
                console.log(`[Execution] Creating playlist: ${playlistName}`);
                // TODO: Create playlist in storage
            }
        } catch (error) {
            console.error('[Execution] Create playlist failed:', error);
        }
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    /**
     * Error handling with user feedback
     */
    handleError(error, context = 'App') {
        console.error(`[Execution] ${context} error:`, error);
        
        // Show user-friendly error message
        // This could be implemented as a toast notification
        alert(`Something went wrong: ${error.message}`);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Execution] DOM loaded, starting Podcast PWA...');
    window.podcastApp = new PodcastApp();
});

// Handle app installation prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[Execution] PWA install prompt available');
    // Store the event for later use
    window.deferredPrompt = e;
    
    // Show custom install button (could be implemented later)
    console.log('[Execution] Custom install UI could be shown here');
});

// Export for testing and module access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PodcastApp, AppState };
}