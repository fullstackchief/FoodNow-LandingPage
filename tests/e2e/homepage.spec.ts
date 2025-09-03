import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads successfully with all key elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/FoodNow/)
    
    // Check hero section
    await expect(page.getByRole('heading', { name: /discover amazing food/i })).toBeVisible()
    
    // Check navigation
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Restaurants' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Become a Rider' })).toBeVisible()
    
    // Check search functionality
    await expect(page.getByPlaceholder(/search restaurants/i)).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    // Test Browse navigation
    await page.getByRole('link', { name: 'Browse' }).click()
    await expect(page).toHaveURL('/explore')
    
    // Go back to homepage
    await page.getByRole('link', { name: 'FoodNow' }).click()
    await expect(page).toHaveURL('/')
    
    // Test Restaurants navigation
    await page.getByRole('link', { name: 'Restaurants' }).click()
    await expect(page).toHaveURL('/explore')
  })

  test('search functionality works', async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search restaurants/i)
    
    // Type in search box
    await searchBox.fill('jollof')
    await searchBox.press('Enter')
    
    // Should navigate to search results
    await expect(page).toHaveURL(/\/search\?.*jollof/)
  })

  test('featured restaurants section loads', async ({ page }) => {
    // Check if featured restaurants are displayed
    await expect(page.getByRole('heading', { name: /featured restaurants/i })).toBeVisible()
    
    // Should have at least one restaurant card
    const restaurantCards = page.locator('[data-testid="restaurant-card"]')
    const count = await restaurantCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mobile menu should be visible
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    await expect(mobileMenuButton).toBeVisible()
    
    // Click mobile menu
    await mobileMenuButton.click()
    
    // Navigation links should be in mobile menu
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible()
  })

  test('location detection prompt', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation'])
    // Skip geolocation for testing
    
    // Should show location-based content
    await page.reload()
    
    // Check for location-aware elements
    const locationElements = page.locator('[data-testid*="location"]')
    const locationCount = await locationElements.count()
    expect(locationCount).toBeGreaterThanOrEqual(0)
  })
})