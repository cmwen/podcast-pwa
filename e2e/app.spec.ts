import { test, expect } from '@playwright/test'

test.describe('Podcast PWA', () => {
  test('should load the app and display navigation', async ({ page }) => {
    await page.goto('/')

    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Podcast PWA' })).toBeVisible()

    // Check for navigation buttons
    await expect(page.getByRole('button', { name: 'Subscriptions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Player' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Playlists' })).toBeVisible()

    // Check for default view
    await expect(page.getByText('No subscriptions yet')).toBeVisible()
  })

  test('should navigate between views', async ({ page }) => {
    await page.goto('/')

    // Navigate to Player view
    await page.getByRole('button', { name: 'Player' }).click()
    await expect(page.getByText('Select an episode to start playing')).toBeVisible()

    // Navigate to Playlists view
    await page.getByRole('button', { name: 'Playlists' }).click()
    await expect(page.getByText('No playlists yet')).toBeVisible()

    // Navigate back to Subscriptions
    await page.getByRole('button', { name: 'Subscriptions' }).click()
    await expect(page.getByText('No subscriptions yet')).toBeVisible()
  })

  test('should be a PWA', async ({ page }) => {
    await page.goto('/')

    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveCount(1)

    // Check for service worker registration (in console logs)
    const logs: string[] = []
    page.on('console', msg => logs.push(msg.text()))

    await page.waitForTimeout(1000) // Wait for service worker registration

    expect(logs.some(log => log.includes('Service Worker'))).toBeTruthy()
  })

  test('should work offline', async ({ page, context }) => {
    await page.goto('/')

    // Go offline
    await context.setOffline(true)

    // App should still be accessible
    await expect(page.getByRole('heading', { name: 'Podcast PWA' })).toBeVisible()

    // Should show offline indicator
    await expect(page.getByText('Offline mode')).toBeVisible()
  })

  test('should handle add subscription interaction', async ({ page }) => {
    await page.goto('/')

    // Mock dialog
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('prompt')
      expect(dialog.message()).toContain('RSS feed URL')
      dialog.accept('https://example.com/rss')
    })

    // Click add subscription button
    await page.getByRole('button', { name: 'Add Podcast' }).click()

    // Should show loading state
    await expect(page.getByText('Loading...')).toBeVisible()
  })
})
