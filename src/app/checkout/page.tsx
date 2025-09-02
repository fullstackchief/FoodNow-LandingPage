'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'
import { useAuth } from '@/contexts/AuthContext'
import { useCheckoutForm } from '@/hooks/useCheckoutForm'
import { useOrderSubmission } from '@/hooks/useOrderSubmission'
import { useCheckoutAuth } from '@/hooks/useCheckoutAuth'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import CheckoutProgressSteps from '@/components/checkout/CheckoutProgressSteps'
import OrderSummary from '@/components/checkout/OrderSummary'
import DeliveryOptions from '@/components/checkout/DeliveryOptions'
import DeliveryForm from '@/components/checkout/DeliveryForm'
import ContactForm from '@/components/checkout/ContactForm'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import OrderConfirmation from '@/components/checkout/OrderConfirmation'
import EmptyCart from '@/components/checkout/EmptyCart'

const CheckoutPage = () => {
  const { state: cartState, updateQuantity, removeItem, getCartTotal, clearCart, restoreCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [orderStep, setOrderStep] = useState(1) // 1: Details, 2: Payment, 3: Confirmation
  
  // Use custom hooks
  const {
    deliveryInfo,
    paymentInfo,
    deliveryType,
    paymentMethod,
    setDeliveryInfo,
    setPaymentInfo,
    setDeliveryType,
    setPaymentMethod,
    saveFormData,
    validateForm
  } = useCheckoutForm()
  
  const { isProcessing, orderError, createdOrderId, submitOrder, setOrderError } = useOrderSubmission()
  
  const { user, isAuthenticated: authFromHook, checkAuthAndSave } = useCheckoutAuth({
    cartState,
    restoreCart,
    orderStep,
    setOrderStep
  })
  
  // Use auth state from hook to avoid conflicts
  const isAuthenticatedFinal = isAuthenticated && authFromHook

  // Form restoration and auth checks handled by useCheckoutAuth hook

  // Clear cart when navigating away from confirmation page
  useEffect(() => {
    return () => {
      // Clean up cart when component unmounts (user navigates away)
      if (orderStep === 3 && createdOrderId) {
        clearCart()
      }
    }
  }, [orderStep, createdOrderId, clearCart])

  // Calculate totals early to avoid hoisting issues
  const subtotal = getCartTotal()
  const deliveryFee = deliveryType === 'delivery' ? (cartState.restaurant?.deliveryFee || 0) : 0
  const serviceFee = Math.round(subtotal * 0.10) // 10% service fee per CLAUDE.local.md
  const total = subtotal + deliveryFee + serviceFee

  // Show order confirmation if on step 3 (takes priority over empty cart check)
  if (orderStep === 3) {
    return (
      <OrderConfirmation 
        createdOrderId={createdOrderId}
        cartState={cartState}
        total={total}
        isAuthenticated={isAuthenticatedFinal}
        onClearCart={clearCart}
      />
    )
  }

  // If cart is empty and not on confirmation step, redirect to browse page
  if ((!cartState.restaurant || cartState.items.length === 0) && orderStep !== 3) {
    return <EmptyCart />
  }

  const handleQuantityUpdate = (itemId: string, change: number) => {
    const currentItem = cartState.items.find(item => item.id === itemId)
    if (currentItem) {
      console.log('Updating quantity:', { itemId, currentQuantity: currentItem.quantity, change, newQuantity: currentItem.quantity + change, customizations: currentItem.customizations })
      updateQuantity(itemId, currentItem.quantity + change, currentItem.customizations)
    }
  }

  const handleContinueToPayment = () => {
    const formData = { deliveryInfo, paymentInfo, deliveryType, paymentMethod }
    
    if (!checkAuthAndSave(formData)) {
      return // Auth redirect handled by hook
    }

    // User is authenticated, proceed to payment step
    setOrderStep(2)
  }

  const handleSubmitOrder = async () => {
    const formData = { deliveryInfo, paymentInfo, deliveryType, paymentMethod }
    
    if (!checkAuthAndSave(formData)) {
      setOrderError('Session expired. Please sign in again.')
      setTimeout(() => {
        window.location.href = '/auth/login?redirect=/checkout'
      }, 2000)
      return
    }

    const result = await submitOrder({
      cartState,
      deliveryInfo,
      paymentMethod,
      user: user!,
      getCartTotal
    })

    if (result.success && result.showConfirmation) {
      setOrderStep(3)
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Back Button */}
      <div className="pt-20 pb-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/restaurant/1"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Menu</span>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <CheckoutProgressSteps currentStep={orderStep} />

      {/* Main Content */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {orderStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Delivery Type */}
                  <DeliveryOptions 
                    deliveryType={deliveryType}
                    onDeliveryTypeChange={setDeliveryType}
                  />

                  {/* Delivery Details */}
                  {deliveryType === 'delivery' && (
                    <DeliveryForm 
                      deliveryInfo={deliveryInfo}
                      onDeliveryInfoChange={setDeliveryInfo}
                    />
                  )}

                  {/* Contact Info for Pickup */}
                  {deliveryType === 'pickup' && (
                    <ContactForm 
                      deliveryInfo={deliveryInfo}
                      onPhoneChange={(phone) => setDeliveryInfo(prev => ({ ...prev, phone }))}
                    />
                  )}

                  {/* Guest Checkout Information */}
                  {!isAuthenticatedFinal && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            Guest Checkout Available
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Continue as guest or sign in for faster future orders and order tracking
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleContinueToPayment}
                    disabled={!deliveryInfo.phone || (deliveryType === 'delivery' && !deliveryInfo.address)}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {orderStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <PaymentMethodSelector 
                    paymentMethod={paymentMethod}
                    paymentInfo={paymentInfo}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaymentInfoChange={setPaymentInfo}
                  />

                  {/* Error Display */}
                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                      <div className="flex space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{orderError}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setOrderStep(1)}
                      className="flex-1 btn-outline"
                    >
                      Back to Details
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isProcessing || (paymentMethod === 'card' && (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName))}
                      className="flex-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Place Order • ₦${total.toLocaleString()}`
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary 
                cartState={cartState}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                serviceFee={serviceFee}
                total={total}
                deliveryType={deliveryType}
                onQuantityUpdate={handleQuantityUpdate}
                onRemoveItem={removeItem}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckoutPage