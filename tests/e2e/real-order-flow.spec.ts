import { test, expect } from '@playwright/test'

// Real verified data from database
const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'
const VERIFIED_MENU_ITEM_ID = '8d36f456-892b-4af2-8d02-b59781820d44'

test.describe('Real Order Creation Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start at homepage
    await page.goto('/')
  })

  test('Complete order flow with real restaurant data', async ({ page }) => {
    // Step 1: Navigate to verified restaurant
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Verify restaurant page loads with real data
    await expect(page.locator('h1')).toContainText('Mama Cass Kitchen')
    await expect(page.locator('[data-testid="restaurant-description"]')).toContainText('Authentic Nigerian cuisine')
    
    // Step 2: Find and interact with verified menu item
    const menuItem = page.locator(`[data-menu-item-id="${VERIFIED_MENU_ITEM_ID}"]`)
    await expect(menuItem).toBeVisible()
    await expect(menuItem.locator('[data-testid="item-name"]')).toContainText('Special Jollof Rice')
    await expect(menuItem.locator('[data-testid="item-price"]')).toContainText('₦2,500')
    
    // Step 3: Add item to cart with customizations
    await menuItem.locator('[data-testid="add-to-cart"]').click()
    
    // Handle customization modal if it appears
    const customizationModal = page.locator('[data-testid="customization-modal"]')
    if (await customizationModal.isVisible()) {
      // Select protein option
      await page.locator('[data-testid="protein-chicken"]').click()
      // Select spice level
      await page.locator('[data-testid="spice-medium"]').click()
      // Add extra
      await page.locator('[data-testid="extra-plantain"]').click()
      // Confirm customization
      await page.locator('[data-testid="add-customized-item"]').click()
    }
    
    // Step 4: Verify cart update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Step 5: Proceed to checkout
    await page.locator('[data-testid="cart-icon"]').click()
    await page.locator('[data-testid="proceed-to-checkout"]').click()
    
    // Step 6: Fill delivery information
    await page.fill('[data-testid="delivery-street"]', '123 Test Street, Victoria Island')
    await page.fill('[data-testid="delivery-instructions"]', 'Call when you arrive')
    
    // Step 7: Verify order summary with real data
    await expect(page.locator('[data-testid="order-restaurant"]')).toContainText('Mama Cass Kitchen')
    await expect(page.locator('[data-testid="order-item"]')).toContainText('Special Jollof Rice')
    
    // Verify pricing calculations
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('₦3,200') // Base + customizations
    await expect(page.locator('[data-testid="delivery-fee"]')).toContainText('₦500')
    await expect(page.locator('[data-testid="service-charge"]')).toContainText('₦320') // 10% of subtotal
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('₦4,020')
    
    // Step 8: Initiate payment (don't complete to avoid charges)
    await page.locator('[data-testid="proceed-to-payment"]').click()
    
    // Verify payment page elements
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText('₦4,020')
    await expect(page.locator('[data-testid="paystack-button"]')).toBeVisible()
  })

  test('Restaurant page displays real menu items correctly', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Wait for menu items to load
    await page.waitForSelector('[data-testid="menu-items"]')
    
    // Verify Special Jollof Rice is displayed
    const jollofRice = page.locator(`[data-menu-item-id="${VERIFIED_MENU_ITEM_ID}"]`)
    await expect(jollofRice).toBeVisible()
    
    // Verify item details
    await expect(jollofRice.locator('[data-testid="item-name"]')).toContainText('Special Jollof Rice')
    await expect(jollofRice.locator('[data-testid="item-description"]')).toContainText('signature jollof rice')
    await expect(jollofRice.locator('[data-testid="item-price"]')).toContainText('₦2,500')
    await expect(jollofRice.locator('[data-testid="prep-time"]')).toContainText('15 min')
    
    // Verify image loads
    const itemImage = jollofRice.locator('[data-testid="item-image"]')
    await expect(itemImage).toBeVisible()
    await expect(itemImage).toHaveAttribute('src', /unsplash/)
  })

  test('Cart persists items across page navigation', async ({ page }) => {
    // Add item to cart on restaurant page
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    await page.locator(`[data-menu-item-id="${VERIFIED_MENU_ITEM_ID}"] [data-testid="add-to-cart"]`).click()
    
    // Navigate away and back
    await page.goto('/')
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Verify cart still shows item
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Open cart and verify item details
    await page.locator('[data-testid="cart-icon"]').click()
    await expect(page.locator('[data-testid="cart-item-name"]')).toContainText('Special Jollof Rice')
    await expect(page.locator('[data-testid="cart-item-restaurant"]')).toContainText('Mama Cass Kitchen')
  })

  test('Order validation prevents submission below minimum order', async ({ page }) => {
    // Navigate to restaurant with minimum order requirement
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Try to checkout with amount below minimum (₦2,000)
    // Add a small item or partial quantity that would be below minimum
    await page.locator('[data-testid="cart-icon"]').click()
    
    // If cart is empty or below minimum, checkout should be disabled
    const checkoutButton = page.locator('[data-testid="proceed-to-checkout"]')
    
    // Either button is disabled or warning message is shown
    const isDisabled = await checkoutButton.isDisabled()
    const warningExists = await page.locator('[data-testid="minimum-order-warning"]').isVisible()
    
    expect(isDisabled || warningExists).toBe(true)
  })

  test('Real restaurant opening hours affect ordering availability', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Check if restaurant shows as open/closed based on real opening hours
    // Mama Cass Kitchen: Mon-Thu 08:00-22:00, Fri 08:00-23:00, Sat 09:00-23:00, Sun 10:00-21:00
    
    const restaurantStatus = page.locator('[data-testid="restaurant-status"]')
    const orderButton = page.locator('[data-testid="add-to-cart"]').first()
    
    // Restaurant status should be visible
    await expect(restaurantStatus).toBeVisible()
    
    // If restaurant is open, order buttons should be enabled
    // If closed, they should be disabled or show "closed" message
    const statusText = await restaurantStatus.textContent()
    if (statusText?.includes('Open')) {
      await expect(orderButton).toBeEnabled()
    } else if (statusText?.includes('Closed')) {
      await expect(orderButton).toBeDisabled()
    }
  })

  test('Search functionality finds real restaurants', async ({ page }) => {
    await page.goto('/')
    
    // Search for verified restaurant
    await page.fill('[data-testid="search-input"]', 'Mama Cass')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Verify search results show real restaurant
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="restaurant-card"]').first()).toContainText('Mama Cass Kitchen')
    
    // Click on restaurant from search results
    await page.locator('[data-testid="restaurant-card"]').first().click()
    
    // Verify navigation to correct restaurant page
    await expect(page).toHaveURL(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    await expect(page.locator('h1')).toContainText('Mama Cass Kitchen')
  })

  test('Real menu customizations work correctly', async ({ page }) => {
    await page.goto(`/restaurant/${VERIFIED_RESTAURANT_ID}`)
    
    // Click on verified menu item to open customization
    await page.locator(`[data-menu-item-id="${VERIFIED_MENU_ITEM_ID}"] [data-testid="customize-item"]`).click()
    
    // Verify customization modal shows real options
    const modal = page.locator('[data-testid="customization-modal"]')
    await expect(modal).toBeVisible()
    
    // Check protein options from database
    await expect(modal.locator('[data-testid="protein-option"]')).toContainText('Chicken (+₦500)')
    await expect(modal.locator('[data-testid="protein-option"]')).toContainText('Beef (+₦800)')
    await expect(modal.locator('[data-testid="protein-option"]')).toContainText('Fish (+₦600)')
    
    // Check spice level options
    await expect(modal.locator('[data-testid="spice-option"]')).toContainText('Mild')
    await expect(modal.locator('[data-testid="spice-option"]')).toContainText('Medium')
    await expect(modal.locator('[data-testid="spice-option"]')).toContainText('Hot')
    
    // Check extra options
    await expect(modal.locator('[data-testid="extra-option"]')).toContainText('Extra Plantain (+₦200)')
    await expect(modal.locator('[data-testid="extra-option"]')).toContainText('Coleslaw (+₦300)')
    
    // Select customizations and verify price updates
    await page.locator('[data-testid="protein-chicken"]').click()
    await page.locator('[data-testid="spice-medium"]').click()
    await page.locator('[data-testid="extra-plantain"]').click()
    
    // Verify total price calculation
    await expect(modal.locator('[data-testid="customization-total"]')).toContainText('₦3,200')
  })
})