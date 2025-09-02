import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { saveCartForAuth, getAuthCart, clearAuthCart } from '@/lib/cartPersistence'
import { CartState } from '@/store/slices/cartSlice'

interface CheckoutFormData {
  deliveryInfo: any
  paymentInfo: any
  deliveryType: string
  paymentMethod: string
}

interface UseCheckoutAuthProps {
  cartState: CartState
  restoreCart: (cart: CartState) => void
  orderStep: number
  setOrderStep: (step: number) => void
}

export const useCheckoutAuth = ({ 
  cartState, 
  restoreCart, 
  orderStep, 
  setOrderStep
}: UseCheckoutAuthProps) => {
  const { user, isAuthenticated } = useAuth()

  // Restore form data and cart after authentication redirect
  useEffect(() => {
    // Restore cart if it was saved for auth
    const savedCart = getAuthCart()
    if (savedCart && cartState.items.length === 0) {
      restoreCart(savedCart)
      clearAuthCart() // Clean up saved cart after restoration
    }
  }, [isAuthenticated, cartState.items.length, restoreCart])

  // Prevent direct access to Step 2 without authentication
  useEffect(() => {
    if (orderStep === 2 && !isAuthenticated) {
      // Reset to step 1 if trying to access payment without auth
      setOrderStep(1)
    }
  }, [orderStep, isAuthenticated, setOrderStep])

  const handleAuthRedirect = (formData: CheckoutFormData) => {
    // Save both form data AND cart data to preserve during auth flow
    localStorage.setItem('checkoutFormData', JSON.stringify(formData))
    
    // Save cart state before redirect
    saveCartForAuth(cartState)
    
    // Redirect to login with checkout redirect and guest checkout context
    window.location.href = '/auth/login?redirect=/checkout&context=guest-checkout&message=signin-or-continue'
  }

  const checkAuthAndSave = (formData: CheckoutFormData): boolean => {
    if (!isAuthenticated || !user) {
      handleAuthRedirect(formData)
      return false
    }
    return true
  }

  return {
    user,
    isAuthenticated,
    handleAuthRedirect,
    checkAuthAndSave
  }
}