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
import Button from '@/components/ui/Button'
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

  // Calculate totals with dynamic pricing
  const subtotal = getCartTotal()
  const [dynamicPricing, setDynamicPricing] = useState<any>(null)
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  
  // Fetch dynamic pricing when order details change
  useEffect(() => {
    const fetchDynamicPricing = async () => {
      if (!cartState.restaurant?.id || !cartState.items.length) return
      
      setIsLoadingPricing(true)
      try {
        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: cartState.restaurant.id,
            zoneId: deliveryInfo.zone || 'isolo',
            orderValue: subtotal,
            deliveryType
          })
        })
        
        if (response.ok) {
          const pricing = await response.json()
          setDynamicPricing(pricing)
        } else {
          throw new Error('Pricing calculation failed')
        }
      } catch (error) {
        setDynamicPricing({
          adjustedPrice: {
            subtotal,
            deliveryFee: deliveryType === 'delivery' ? (cartState.restaurant?.deliveryFee || 0) : 0,
            serviceFee: Math.round(subtotal * 0.10),
            total: subtotal + (deliveryType === 'delivery' ? (cartState.restaurant?.deliveryFee || 0) : 0) + Math.round(subtotal * 0.10),
            surgeAmount: 0
          },
          surgeInfo: { isActive: false, displayMessage: 'Standard pricing' }
        })
      } finally {
        setIsLoadingPricing(false)
      }
    }
    
    fetchDynamicPricing()
  }, [cartState.restaurant?.id, subtotal, deliveryType, deliveryInfo.zone])
  
  // Use dynamic pricing or fallback to static
  const deliveryFee = dynamicPricing?.adjustedPrice?.deliveryFee || (deliveryType === 'delivery' ? (cartState.restaurant?.deliveryFee || 0) : 0)
  const serviceFee = dynamicPricing?.adjustedPrice?.serviceFee || Math.round(subtotal * 0.10)
  const total = dynamicPricing?.adjustedPrice?.total || (subtotal + deliveryFee + serviceFee)

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
            href={cartState.restaurant?.id ? `/restaurant/${cartState.restaurant.id}` : '/explore'}
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
      <section className="py-4 md:py-8 bg-gray-50 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            
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

                  {/* Mobile Sticky Button */}
                  <div className="md:hidden mobile-sticky-bottom">
                    <Button
                      onClick={handleContinueToPayment}
                      disabled={!deliveryInfo.phone || (deliveryType === 'delivery' && (!deliveryInfo.address || !deliveryInfo.zone))}
                      theme="customer"
                      variant="primary"
                      fullWidth
                      size="lg"
                      className="touch-optimized"
                    >
                      Continue to Payment
                    </Button>
                  </div>

                  {/* Desktop Button */}
                  <div className="hidden md:block">
                    <Button
                      onClick={handleContinueToPayment}
                      disabled={!deliveryInfo.phone || (deliveryType === 'delivery' && (!deliveryInfo.address || !deliveryInfo.zone))}
                      theme="customer"
                      variant="primary"
                      fullWidth
                    >
                      Continue to Payment
                    </Button>
                  </div>
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

                  {/* Mobile Sticky Action Buttons */}
                  <div className="md:hidden mobile-sticky-bottom">
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setOrderStep(1)}
                        theme="customer"
                        variant="outline"
                        size="lg"
                        className="w-20 touch-optimized"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmitOrder}
                        disabled={isProcessing || (paymentMethod === 'card' && (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName))}
                        theme="customer"
                        variant="primary"
                        size="lg"
                        loading={isProcessing}
                        className="flex-1 touch-optimized"
                      >
                        {isProcessing ? 'Processing...' : `Place Order • ₦${total.toLocaleString()}`}
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="hidden md:flex space-x-4">
                    <Button
                      onClick={() => setOrderStep(1)}
                      theme="customer"
                      variant="outline"
                      className="flex-1"
                    >
                      Back to Details
                    </Button>
                    <Button
                      onClick={handleSubmitOrder}
                      disabled={isProcessing || (paymentMethod === 'card' && (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName))}
                      theme="customer"
                      variant="primary"
                      loading={isProcessing}
                      className="flex-2 min-w-[200px]"
                    >
                      {isProcessing ? 'Processing...' : `Place Order • ₦${total.toLocaleString()}`}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Order Summary (Mobile: Top, Desktop: Right) */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-24">
                <OrderSummary 
                  cartState={cartState}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                serviceFee={serviceFee}
                  total={total}
                  deliveryType={deliveryType}
                  onQuantityUpdate={handleQuantityUpdate}
                  onRemoveItem={removeItem}
                  dynamicPricing={dynamicPricing}
                  isLoadingPricing={isLoadingPricing}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckoutPage