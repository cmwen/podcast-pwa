import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/preact'
import { Navigation } from '@/components/Navigation'

describe('Navigation Component', () => {
  const mockOnViewChange = vi.fn()

  beforeEach(() => {
    mockOnViewChange.mockClear()
  })

  it('should render all navigation items', () => {
    const { getByRole } = render(
      <Navigation currentView="subscriptions" onViewChange={mockOnViewChange} />
    )

    expect(getByRole('button', { name: 'Subscriptions' })).toBeDefined()
    expect(getByRole('button', { name: 'Player' })).toBeDefined()
    expect(getByRole('button', { name: 'Playlists' })).toBeDefined()
  })

  it('should highlight the current view', () => {
    const { getByRole } = render(
      <Navigation currentView="player" onViewChange={mockOnViewChange} />
    )

    const playerButton = getByRole('button', { name: 'Player' })
    expect(playerButton.className).toContain('active')
    expect(playerButton.getAttribute('aria-pressed')).toBe('true')
  })

  it('should call onViewChange when button is clicked', () => {
    const { getByRole } = render(
      <Navigation currentView="subscriptions" onViewChange={mockOnViewChange} />
    )

    getByRole('button', { name: 'Player' }).click()
    expect(mockOnViewChange).toHaveBeenCalledWith('player')
  })
})
