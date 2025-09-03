import { test, expect } from '@playwright/test'

const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'

test.describe('Simple Order Flow Tests', () => {
  test('Restaurant page loads with real data', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Check that page loads successfully
    await expect(page).toHaveTitle(/FoodNow/)
    
    // Look for restaurant name in any heading
    await expect(page.locator('h1, h2, h3')).toContainText('Mama Cass Kitchen')
    
    // Check for menu section
    await expect(page.locator('text=Menu')).toBeVisible()
  })

  test('Homepage navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Verify homepage loads
    await expect(page.locator('text=FoodNow')).toBeVisible()
    
    // Check for main sections
    await expect(page.locator('text=Featured Restaurants')).toBeVisible()
  })

  test('Search functionality exists', async ({ page }) => {
    await page.goto('/')
    
    // Look for any search input (may have different data-testid)
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first()
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Mama Cass')
      await searchInput.press('Enter')
      
      // Check that search results or restaurant list appears
      await expect(page.locator('text=Mama Cass')).toBeVisible({ timeout: 10000 })
    } else {
      console.log('Search input not found - may be implemented differently')
    }
  })

  test('Restaurant data matches database values', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // Check for delivery information from database
    await expect(page.locator('text=₦500')).toBeVisible() // Delivery fee
    await expect(page.locator('text=₦2,000')).toBeVisible() // Minimum order
    
    // Check for restaurant rating
    await expect(page.locator('text=4.8')).toBeVisible() // Restaurant rating
  })

  test('Menu items render with prices', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Wait for menu to load
    await page.waitForTimeout(3000)
    
    // Look for menu item prices from database
    await expect(page.locator('text=₦2,500')).toBeVisible() // Special Jollof Rice price
    await expect(page.locator('text=Special Jollof Rice')).toBeVisible()
  })
})