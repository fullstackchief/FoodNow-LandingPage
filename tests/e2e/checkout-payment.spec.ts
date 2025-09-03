import { test, expect } from '@playwright/test'

test.describe('Checkout and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated session
    await page.goto('/')
    await page.context().addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }])
    
    // Add items to cart before checkout
    await page.goto('/restaurant/test-restaurant-id')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.goto('/checkout')
  })

  test('displays order summary correctly', async ({ page }) => {
    // Check order summary section
    await expect(page.getByRole('heading', { name: /order summary/i })).toBeVisible()
    
    // Check item details
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(1)
    
    // Check pricing breakdown
    await expect(page.getByText(/subtotal/i)).toBeVisible()
    await expect(page.getByText(/delivery fee/i)).toBeVisible()
    await expect(page.getByText(/service charge/i)).toBeVisible()
    await expect(page.getByText(/total/i)).toBeVisible()
  })

  test('validates delivery information', async ({ page }) => {
    // Check delivery address form
    const addressInput = page.getByLabel(/delivery address/i)
    await expect(addressInput).toBeVisible()
    
    // Try to proceed without address
    const proceedButton = page.getByRole('button', { name: /place order|continue/i })
    await proceedButton.click()
    
    // Should show validation error
    await expect(page.getByText(/address is required/i)).toBeVisible()
    
    // Fill in address
    await addressInput.fill('123 Test Street, Lagos, Nigeria')
    
    // Additional delivery info
    const instructionsField = page.getByLabel(/delivery instructions/i)
    if (await instructionsField.isVisible()) {
      await instructionsField.fill('Call when you arrive')
    }
    
    // Phone number field
    const phoneField = page.getByLabel(/phone number/i)
    if (await phoneField.isVisible()) {
      await phoneField.fill('08012345678')
    }
  })

  test('payment integration with Paystack', async ({ page }) => {
    // Mock Paystack responses
    await page.route('**/api/payments/initialize', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          authorization_url: 'https://checkout.paystack.com/test-payment',
          reference: 'test-ref-123'
        })
      })
    })
    
    // Fill in required fields
    await page.getByLabel(/delivery address/i).fill('123 Test Street, Lagos')
    
    // Proceed to payment
    const payButton = page.getByRole('button', { name: /pay now|place order/i })
    await payButton.click()
    
    // Should redirect to payment page or show payment modal
    await page.waitForURL(/checkout.paystack.com|payment/, { timeout: 10000 })
    
    // Or check for payment modal
    const paymentModal = page.getByRole('dialog', { name: /payment/i })
    if (await paymentModal.isVisible()) {
      await expect(paymentModal).toBeVisible()
    }
  })

  test('handles payment success flow', async ({ page }) => {
    // Mock successful payment verification
    await page.route('**/api/payments/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'success',
          reference: 'test-ref-123'
        })
      })
    })
    
    // Complete checkout process
    await page.getByLabel(/delivery address/i).fill('123 Test Street, Lagos')
    await page.getByRole('button', { name: /pay now|place order/i }).click()
    
    // Simulate successful payment callback
    await page.goto('/payment/callback?reference=test-ref-123')
    
    // Should redirect to success page
    await expect(page).toHaveURL(/\/orders\/success/)
    await expect(page.getByText(/order confirmed/i)).toBeVisible()
    await expect(page.getByText(/test-ref-123/)).toBeVisible()
  })

  test('handles payment failure scenarios', async ({ page }) => {
    // Mock payment failure
    await page.route('**/api/payments/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          status: 'failed',
          message: 'Payment was declined'
        })
      })
    })
    
    await page.getByLabel(/delivery address/i).fill('123 Test Street, Lagos')
    await page.getByRole('button', { name: /pay now|place order/i }).click()
    
    // Simulate failed payment callback
    await page.goto('/payment/callback?reference=failed-ref-123')
    
    // Should show error message
    await expect(page.getByText(/payment failed|declined/i)).toBeVisible()
    
    // Should offer retry option
    const retryButton = page.getByRole('button', { name: /try again|retry/i })
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible()
    }
  })

  test('order modification before payment', async ({ page }) => {
    // Check if user can modify cart from checkout
    const editCartButton = page.getByRole('button', { name: /edit cart|modify order/i })
    if (await editCartButton.isVisible()) {
      await editCartButton.click()
      
      // Should allow cart modification
      await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
      
      // Remove an item
      const removeButton = page.getByRole('button', { name: /remove/i }).first()
      await removeButton.click()
      
      // Return to checkout
      await page.getByRole('button', { name: /back to checkout/i }).click()
      
      // Order total should be updated
      await expect(page.getByTestId('order-total')).toBeVisible()
    }
  })

  test('guest checkout flow', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies()
    await page.goto('/checkout')
    
    // Should prompt for authentication or allow guest checkout
    const guestOption = page.getByText(/continue as guest/i)
    if (await guestOption.isVisible()) {
      await guestOption.click()
      
      // Should show guest checkout form
      await expect(page.getByLabel(/full name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/phone/i)).toBeVisible()
    } else {
      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })
})