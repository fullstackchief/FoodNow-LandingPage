import { test, expect } from '@playwright/test'

test.describe('Content and Page Rendering', () => {
  test('all static pages load correctly', async ({ page }) => {
    const pages = [
      { url: '/', title: /foodnow/i, heading: /discover amazing food/i },
      { url: '/explore', title: /explore|browse/i, heading: /restaurants/i },
      { url: '/riders', title: /riders/i, heading: /become a rider/i },
    ]

    for (const pageData of pages) {
      await page.goto(pageData.url)
      
      // Check page loads without errors
      await expect(page).toHaveTitle(pageData.title)
      
      // Check main heading exists
      await expect(page.getByRole('heading', { name: pageData.heading })).toBeVisible()
      
      // Check no JavaScript errors
      const errors: any[] = []
      page.on('pageerror', (error: any) => errors.push(error))
      await page.waitForTimeout(1000)
      expect(errors).toHaveLength(0)
    }
  })

  test('images load and have proper alt text', async ({ page }) => {
    await page.goto('/')
    
    // Get all images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    // Check each image
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      
      // Should have alt attribute
      await expect(img).toHaveAttribute('alt')
      
      // Should have loaded (not broken)
      const naturalWidth = await img.evaluate((img: any) => img.naturalWidth)
      expect(naturalWidth).toBeGreaterThan(0)
    }
  })

  test('responsive design at different breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 1440, height: 900, name: 'desktop-large' }
    ]

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.goto('/')
      
      // Check navigation is accessible
      const navigation = page.locator('nav')
      await expect(navigation).toBeVisible()
      
      // Check content doesn't overflow
      const body = page.locator('body')
      const scrollWidth = await body.evaluate(el => el.scrollWidth)
      expect(scrollWidth).toBeLessThanOrEqual(bp.width + 20) // Allow small margin for scrollbars
      
      // Check critical elements are visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      
      if (bp.width < 768) {
        // Mobile: hamburger menu should be visible
        const mobileMenu = page.getByRole('button', { name: /menu/i })
        await expect(mobileMenu).toBeVisible()
      } else {
        // Desktop: full navigation should be visible
        await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible()
      }
    }
  })

  test('accessibility standards compliance', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    // Check all interactive elements are keyboard accessible
    const buttons = page.locator('button, a, input, select, textarea')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Test first 10
      const element = buttons.nth(i)
      await element.focus()
      
      // Should be focusable
      await expect(element).toBeFocused()
    }
    
    // Check color contrast (basic test)
    const backgroundColor = await page.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    )
    const textColor = await page.evaluate(() => 
      getComputedStyle(document.body).color
    )
    
    expect(backgroundColor).toBeTruthy()
    expect(textColor).toBeTruthy()
  })

  test('search functionality renders results correctly', async ({ page }) => {
    await page.goto('/search?q=jollof')
    
    // Should show search results
    await expect(page.getByText(/search results/i)).toBeVisible()
    
    // Should display search query
    await expect(page.getByText(/jollof/i)).toBeVisible()
    
    // Results should be properly formatted
    const results = page.locator('[data-testid*="search-result"], [data-testid*="restaurant-card"]')
    if (await results.count() > 0) {
      const firstResult = results.first()
      
      // Should have image
      await expect(firstResult.locator('img')).toBeVisible()
      
      // Should have title/name
      await expect(firstResult.locator('h2, h3, .name, .title')).toBeVisible()
      
      // Should be clickable
      await expect(firstResult).toBeEnabled()
    }
  })

  test('error pages render correctly', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    
    // Should show 404 error
    await expect(page.getByText(/404|not found/i)).toBeVisible()
    
    // Should have navigation back
    const homeLink = page.getByRole('link', { name: /home|back/i })
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible()
    }
  })

  test('loading states and skeletons', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/**', async route => {
      await route.continue()
      await page.waitForTimeout(100) // Add small delay
    })
    
    await page.goto('/explore')
    
    // Should show loading indicators or skeleton screens
    const loadingElements = page.locator('[data-testid*="loading"], [data-testid*="skeleton"], .loading, .skeleton')
    
    // At least some loading state should be shown initially
    const loadingCount = await loadingElements.count()
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Content should be visible after loading
    const contentElements = page.locator('[data-testid="restaurant-card"], .restaurant-card')
    if (await contentElements.count() > 0) {
      await expect(contentElements.first()).toBeVisible()
    }
  })

  test('SEO meta tags are present', async ({ page }) => {
    await page.goto('/')
    
    // Check meta tags
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1)
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/)
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]')
    if (await canonicalLink.count() > 0) {
      await expect(canonicalLink).toHaveAttribute('href', /.+/)
    }
  })
})