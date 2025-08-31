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

    // Check for default view - updated to match actual text
    await expect(page.getByText('No subscriptions yet. Add your first podcast!')).toBeVisible()
  })

  test('should navigate between views', async ({ page }) => {
    await page.goto('/')

    // Navigate to Player view
    await page.getByRole('button', { name: 'Player' }).click()
    await expect(page.getByText('Select an episode from your subscriptions to start playing')).toBeVisible()

    // Navigate to Playlists view
    await page.getByRole('button', { name: 'Playlists' }).click()
    await expect(page.getByText('No playlists yet. Create your first playlist!')).toBeVisible()

    // Navigate back to Subscriptions
    await page.getByRole('button', { name: 'Subscriptions' }).click()
    await expect(page.getByText('No subscriptions yet. Add your first podcast!')).toBeVisible()
  })

  test('should be a PWA', async ({ page }) => {
    await page.goto('/')

    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveCount(1)

    // Wait for service worker registration and check navigator.serviceWorker
    await page.waitForTimeout(3000) // Give service worker time to register

    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(hasServiceWorker).toBeTruthy()

    // Optionally check if service worker is actually registered
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration
      }
      return false
    })
    expect(swRegistration).toBeTruthy()
  })

  test('should work offline', async ({ page, context }) => {
    await page.goto('/')

    // Go offline by setting context offline and triggering the event
    await context.setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })

    // App should still be accessible
    await expect(page.getByRole('heading', { name: 'Podcast PWA' })).toBeVisible()

    // Should show offline indicator
    await expect(page.getByText('Offline mode')).toBeVisible()
  })

  test('should handle add subscription interaction', async ({ page }) => {
    await page.goto('/')

    // Click add subscription button
    await page.getByRole('button', { name: 'Add Podcast' }).click()

    // Should show the form
    await expect(page.getByText('Add New Podcast')).toBeVisible()

    // Fill in the RSS URL
    await page.getByLabel('RSS Feed URL:').fill('https://example.com/rss')

    // Click Add Subscription button (this will show loading state)
    await page.getByRole('button', { name: 'Add Subscription' }).click()

    // Should show loading state
    await expect(page.getByText('Adding...')).toBeVisible()
  })
})
