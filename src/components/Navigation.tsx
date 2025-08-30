import type { AppState } from '@/types'

interface NavigationProps {
  currentView: AppState['currentView']
  onViewChange: (view: AppState['currentView']) => void
}

/**
 * Navigation Component
 * [Design → Execution] Touch-friendly navigation with clear active states
 */
export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'player', label: 'Player' },
    { id: 'playlists', label: 'Playlists' },
  ] as const

  return (
    <nav className="main-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
          aria-pressed={currentView === item.id}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
