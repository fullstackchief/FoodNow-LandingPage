// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('FoodNow Homepage', () => {
  test('loads and displays main content correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to fully load and animations to complete
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for Framer Motion animations to finish
    await page.waitForTimeout(1000);

    // Verify page title
    await expect(page).toHaveTitle(/FoodNow/);

    // Check main heading is visible (this was hidden with opacity:0 in SSR)
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('FoodNow');

    // Verify hero section content
    await expect(page.locator('text=Premium Food Delivery')).toBeVisible();
    await expect(page.locator('text=in Lagos')).toBeVisible();
    await expect(page.locator('text=30 minutes')).toBeVisible();

    // Check navigation is visible (was off-screen with translateY(-100px))
    const navigation = page.locator('header nav');
    await expect(navigation).toBeVisible();
    
    // Verify navigation links
    await expect(page.locator('nav >> text=Explore')).toBeVisible();
    await expect(page.locator('nav >> text=About')).toBeVisible();
    await expect(page.locator('nav >> text=Partners')).toBeVisible();
    await expect(page.locator('nav >> text=Contact')).toBeVisible();

    // Check call-to-action buttons are visible
    await expect(page.getByRole('button', { name: 'Order Now' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download App' })).toBeVisible();

    // Verify stats section
    await expect(page.locator('text=10,000+')).toBeVisible();
    await expect(page.locator('text=Happy Customers')).toBeVisible();
    await expect(page.locator('text=50+')).toBeVisible();
    await expect(page.locator('text=Restaurant Partners')).toBeVisible();

    // Check location tags
    await expect(page.locator('text=Isolo')).toBeVisible();
    await expect(page.locator('text=Ikeja')).toBeVisible();

    // Take screenshot of fully loaded page
    await page.screenshot({ 
      path: 'test-results/homepage-loaded.png',
      fullPage: true 
    });
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to Explore page
    await page.click('nav >> text=Explore');
    await expect(page).toHaveURL(/.*explore/);
    
    // Go back to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Order Now button
    await page.click('text=Order Now >> nth=0');
    await expect(page).toHaveURL(/.*browse/);
  });

  test('responsive design works on mobile', async ({ page, isMobile }) => {
    if (!isMobile) return; // Only run on mobile devices
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify mobile-specific elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Premium Food Delivery')).toBeVisible();
    
    // Check that mobile menu button is visible (hamburger menu)
    const mobileMenuButton = page.locator('button.lg\\:hidden');
    await expect(mobileMenuButton).toBeVisible();

    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/homepage-mobile.png',
      fullPage: true 
    });
  });

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no critical console errors
    expect(consoleErrors.length).toBe(0);
  });
});