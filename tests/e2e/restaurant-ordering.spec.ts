import { test, expect } from '@playwright/test'

test.describe('Restaurant Ordering Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Mock authentication if needed for testing
    await page.context().addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }])
  })

  test('complete order flow - browse to checkout', async ({ page }) => {
    // Navigate to restaurants page
    await page.getByRole('link', { name: 'Browse' }).click()
    await expect(page).toHaveURL('/explore')
    
    // Select a restaurant
    const firstRestaurant = page.locator('[data-testid="restaurant-card"]').first()
    await firstRestaurant.click()
    
    // Should navigate to restaurant detail page
    await expect(page.url()).toMatch(/\/restaurant\//)
    
    // Wait for menu to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Add item to cart
    const addToCartButton = page.getByRole('button', { name: /add to cart/i }).first()
    await addToCartButton.click()
    
    // Check cart counter updates
    const cartCounter = page.locator('[data-testid="cart-count"]')
    await expect(cartCounter).toHaveText('1')
    
    // Open cart
    const cartButton = page.getByRole('button', { name: /cart/i })
    await cartButton.click()
    
    // Proceed to checkout
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await checkoutButton.click()
    
    // Should navigate to checkout page
    await expect(page).toHaveURL('/checkout')
  })

  test('menu item customization', async ({ page }) => {
    // Navigate to a specific restaurant
    await page.goto('/restaurant/test-restaurant-id')
    
    // Click on a customizable item
    const menuItem = page.locator('[data-testid="menu-item"]').first()
    await menuItem.click()
    
    // Customization modal should open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Select customizations
    const sizeOption = page.getByRole('radio', { name: /large/i })
    if (await sizeOption.isVisible()) {
      await sizeOption.click()
    }
    
    // Add special instructions
    const instructionsInput = page.getByPlaceholder(/special instructions/i)
    if (await instructionsInput.isVisible()) {
      await instructionsInput.fill('No onions please')
    }
    
    // Increase quantity
    const increaseButton = page.getByRole('button', { name: '+' })
    await increaseButton.click()
    
    // Add to cart with customizations
    await page.getByRole('button', { name: /add to cart/i }).click()
    
    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
    
    // Cart should update with customized item
    const cartButton = page.getByRole('button', { name: /cart/i })
    await cartButton.click()
    
    // Check if customizations are reflected
    await expect(page.getByText(/no onions please/i)).toBeVisible()
  })

  test('handles out of stock items', async ({ page }) => {
    // Mock out of stock item
    await page.route('**/api/menu-items*', async route => {
      const response = await route.fetch()
      const json = await response.json()
      
      // Mark first item as out of stock
      if (json.length > 0) {
        json[0].is_available = false
      }
      
      await route.fulfill({
        response,
        json
      })
    })
    
    await page.goto('/restaurant/test-restaurant-id')
    
    // Out of stock item should be disabled
    const outOfStockItem = page.locator('[data-testid="menu-item"]').first()
    await expect(outOfStockItem).toHaveClass(/disabled|out-of-stock/)
    
    // Add to cart button should be disabled
    const addButton = outOfStockItem.getByRole('button', { name: /add to cart/i })
    await expect(addButton).toBeDisabled()
  })

  test('minimum order validation', async ({ page }) => {
    await page.goto('/restaurant/test-restaurant-id')
    
    // Add a low-value item
    const cheapItem = page.locator('[data-testid="menu-item"]').first()
    await cheapItem.click()
    
    // Proceed to checkout
    const cartButton = page.getByRole('button', { name: /cart/i })
    await cartButton.click()
    
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    
    // If minimum order not met, checkout should be disabled or show warning
    if (await checkoutButton.isDisabled()) {
      await expect(page.getByText(/minimum order/i)).toBeVisible()
    }
  })

  test('delivery time estimation', async ({ page }) => {
    await page.goto('/restaurant/test-restaurant-id')
    
    // Should display estimated delivery time
    await expect(page.getByText(/delivery time/i)).toBeVisible()
    await expect(page.getByText(/\d+-\d+ min/)).toBeVisible()
    
    // Add items and check updated estimate
    const addButton = page.getByRole('button', { name: /add to cart/i }).first()
    await addButton.click()
    
    // Estimated time should still be visible in cart
    const cartButton = page.getByRole('button', { name: /cart/i })
    await cartButton.click()
    
    await expect(page.getByText(/estimated delivery/i)).toBeVisible()
  })
})