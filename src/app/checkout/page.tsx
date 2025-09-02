'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'
import { useAuth } from '@/contexts/AuthContext'
import { createOrder } from '@/lib/orderService'
import { initializePayment } from '@/lib/payment-client'
import { saveCartForAuth, getAuthCart, clearAuthCart } from '@/lib/cartPersistence'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  CreditCardIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'

const CheckoutPage = () => {
  const { state: cartState, updateQuantity, getCartTotal, clearCart, restoreCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [orderStep, setOrderStep] = useState(1) // 1: Details, 2: Payment, 3: Confirmation
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    apartment: '',
    phone: '',
    instructions: ''
  })

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  })

  // Restore form data and cart after authentication redirect
  useEffect(() => {
    // Restore cart if it was saved for auth
    const savedCart = getAuthCart()
    if (savedCart && cartState.items.length === 0) {
      restoreCart(savedCart)
      clearAuthCart() // Clean up saved cart after restoration
    }

    // Restore form data
    const savedFormData = localStorage.getItem('checkoutFormData')
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData)
        setDeliveryInfo(formData.deliveryInfo || deliveryInfo)
        setPaymentInfo(formData.paymentInfo || paymentInfo)
        setDeliveryType(formData.deliveryType || 'delivery')
        setPaymentMethod(formData.paymentMethod || 'card')
        localStorage.removeItem('checkoutFormData') // Clean up
        
        // If user was on step 2 and is now authenticated, keep them on step 2
        if (isAuthenticated && formData.deliveryInfo?.phone) {
          setOrderStep(2)
        }
      } catch (error) {
        console.warn('Failed to restore form data:', error)
      }
    }
  }, [isAuthenticated, cartState.items.length, restoreCart])

  // Prevent direct access to Step 2 without authentication
  useEffect(() => {
    if (orderStep === 2 && !isAuthenticated) {
      // Reset to step 1 if trying to access payment without auth
      setOrderStep(1)
    }
  }, [orderStep, isAuthenticated])

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
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-premium p-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="text-lg text-gray-600 mb-6">
                Your order has been placed successfully. You&apos;ll receive a confirmation shortly.
              </p>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Order Number</p>
                    <p className="font-semibold text-gray-900">{createdOrderId ? `#${createdOrderId.slice(-8).toUpperCase()}` : '#PENDING'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Estimated Delivery</p>
                    <p className="font-semibold text-gray-900">{cartState.restaurant?.deliveryTime || '25-35 min'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Restaurant</p>
                    <p className="font-semibold text-gray-900">{cartState.restaurant?.name || 'Restaurant'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Total Amount</p>
                    <p className="font-semibold text-orange-600">₦{total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Post-Order Account Creation for Guests */}
              {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Create Account for Easy Reordering
                    </h3>
                    <p className="text-sm text-blue-700">
                      Track your order, save favorites, and checkout faster next time. All your order details are ready!
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/auth/signup?prefill=checkout&orderId=${createdOrderId}`} className="flex-1">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Create Account
                      </button>
                    </Link>
                    <button 
                      onClick={() => localStorage.setItem('skipAccountCreation', 'true')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="flex-1 btn-outline"
                  onClick={() => {
                    clearCart() // Clear cart when user wants to order again
                    window.location.href = '/explore'
                  }}
                >
                  Order Again
                </button>
                {createdOrderId ? (
                  <Link href={`/orders/${createdOrderId}`} className="flex-1">
                    <button className="w-full btn-primary">
                      Track Order
                    </button>
                  </Link>
                ) : (
                  <Link href="/dashboard/orders" className="flex-1">
                    <button className="w-full btn-primary">
                      View Orders
                    </button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // If cart is empty and not on confirmation step, redirect to browse page
  if ((!cartState.restaurant || cartState.items.length === 0) && orderStep !== 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-gray-400">🛒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some delicious items to proceed to checkout</p>
          <Link href="/explore">
            <button className="btn-primary">
              Browse Restaurants
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const handleQuantityUpdate = (itemId: string, change: number) => {
    const currentItem = cartState.items.find(item => item.id === itemId)
    if (currentItem) {
      updateQuantity(itemId, currentItem.quantity + change)
    }
  }

  const handleContinueToPayment = () => {
    // Check authentication before allowing payment step
    if (!isAuthenticated || !user) {
      // Save both form data AND cart data to preserve during auth flow
      const formData = {
        deliveryInfo,
        paymentInfo,
        deliveryType,
        paymentMethod
      }
      localStorage.setItem('checkoutFormData', JSON.stringify(formData))
      
      // Save cart state before redirect
      saveCartForAuth(cartState)
      
      // Redirect to login with checkout redirect and guest checkout context
      window.location.href = '/auth/login?redirect=/checkout&context=guest-checkout&message=signin-or-continue'
      return
    }

    // User is authenticated, proceed to payment step
    setOrderStep(2)
  }

  const handleSubmitOrder = async () => {
    // Double-check authentication to ensure user exists
    if (!isAuthenticated || !user) {
      setOrderError('Session expired. Please sign in again.')
      // Save current form state and cart, then redirect to login
      const formData = {
        deliveryInfo,
        paymentInfo,
        deliveryType,
        paymentMethod
      }
      localStorage.setItem('checkoutFormData', JSON.stringify(formData))
      saveCartForAuth(cartState) // Save cart too
      setTimeout(() => {
        window.location.href = '/auth/login?redirect=/checkout'
      }, 2000)
      return
    }

    if (!cartState.restaurant || cartState.items.length === 0) {
      setOrderError('Your cart is empty')
      return
    }

    if (!deliveryInfo.address || !deliveryInfo.phone) {
      setOrderError('Please provide delivery address and phone number')
      return
    }

    setIsProcessing(true)
    setOrderError(null)

    try {
      // Debug user data before order creation
      console.log('🔍 Checkout Debug - User data:', {
        user,
        userKeys: Object.keys(user || {}),
        userId: user?.id,
        userEmail: user?.email,
        firstName: user?.first_name,
        lastName: user?.last_name,
        isAuthenticated,
        cartItemsCount: cartState?.items?.length
      })

      // Create order first
      const orderData = {
        userId: user.id,
        cartState,
        deliveryAddress: {
          street: deliveryInfo.address,
          area: deliveryInfo.apartment || '',
          city: 'Lagos',
          state: 'Lagos',
          instructions: deliveryInfo.instructions
        },
        paymentMethod,
        specialInstructions: deliveryInfo.instructions,
        userData: {
          id: user.id,
          email: user.email || '',
          firstName: user.first_name,
          lastName: user.last_name
        }
      }

      console.log('🔍 Checkout Debug - Order data:', {
        orderData,
        hasUserData: !!orderData.userData,
        userDataKeys: Object.keys(orderData.userData || {}),
        cartItemsCount: orderData.cartState?.items?.length
      })

      const { data: order, error: orderError } = await createOrder(orderData)

      if (orderError || !order) {
        setOrderError(orderError || 'Failed to create order')
        return
      }

      setCreatedOrderId(order.id)

      // Handle payment based on method
      if (paymentMethod === 'card') {
        // Initialize Paystack payment
        const paymentData = {
          orderId: order.id,
          amount: getCartTotal() + (cartState.restaurant?.deliveryFee || 0),
          email: user.email || '',
          userId: user.id,
          customerName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          orderItems: cartState.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          deliveryAddress: {
            street: deliveryInfo.address,
            area: deliveryInfo.apartment || '',
            city: 'Lagos',
            state: 'Lagos'
          }
        }

        const { success, data: paymentInit, error: paymentError } = await initializePayment(paymentData)

        if (!success || !paymentInit) {
          setOrderError(paymentError || 'Failed to initialize payment')
          return
        }

        // Redirect to Paystack payment page
        window.location.href = paymentInit.authorization_url
      } else {
        // Cash payment - go directly to confirmation (don't clear cart yet)
        setOrderStep(3)
      }

    } catch (error) {
      console.error('Order submission error:', error)
      setOrderError('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderOrderSummary = () => (
    <div className="bg-white rounded-3xl shadow-premium p-6 sticky top-24">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
      
      {/* Restaurant Info */}
      <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🍽️</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{cartState.restaurant?.name || 'Restaurant'}</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{cartState.restaurant?.deliveryTime || '25-35 min'}</span>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cartState.items.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{item.name}</h5>
                {item.customizations && item.customizations.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.customizations.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleQuantityUpdate(item.id, -1)}
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <MinusIcon className="w-3 h-3 text-gray-600" />
                </button>
                <span className="font-medium text-gray-900 px-2">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityUpdate(item.id, 1)}
                  className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">₦{item.price.toLocaleString()} each</span>
              <span className="font-medium text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-6 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Service fee</span>
          <span className="text-gray-900">₦{serviceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{deliveryType === 'delivery' ? 'Delivery fee' : 'Pickup'}</span>
          <span className="text-gray-900">
            {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-orange-600">₦{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )

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
      <section className="bg-white pb-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Details', icon: UserIcon },
              { step: 2, label: 'Payment', icon: CreditCardIcon },
              { step: 3, label: 'Confirmation', icon: CheckCircleIcon }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  orderStep >= step 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${
                  orderStep >= step ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {step < 3 && (
                  <div className={`w-8 h-0.5 ${
                    orderStep > step ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  <div className="bg-white rounded-3xl shadow-premium p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Option</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          deliveryType === 'delivery'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MapPinIcon className="w-8 h-8 text-orange-500 mb-2 mx-auto" />
                        <p className="font-semibold text-gray-900">Delivery</p>
                        <p className="text-sm text-gray-600">To your address</p>
                      </button>
                      
                      <button
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          deliveryType === 'pickup'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 text-orange-500 mb-2 mx-auto flex items-center justify-center">
                          <span className="text-2xl">🏃‍♂️</span>
                        </div>
                        <p className="font-semibold text-gray-900">Pickup</p>
                        <p className="text-sm text-gray-600">From restaurant</p>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  {deliveryType === 'delivery' && (
                    <div className="bg-white rounded-3xl shadow-premium p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={deliveryInfo.address}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter your delivery address"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apartment/Unit (Optional)
                          </label>
                          <input
                            type="text"
                            value={deliveryInfo.apartment}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, apartment: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Apt, suite, unit, etc."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={deliveryInfo.phone}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Instructions (Optional)
                          </label>
                          <textarea
                            value={deliveryInfo.instructions}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, instructions: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 h-24"
                            placeholder="Add delivery instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Info for Pickup */}
                  {deliveryType === 'pickup' && (
                    <div className="bg-white rounded-3xl shadow-premium p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={deliveryInfo.phone}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <MapPinIcon className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900">Pickup Location</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Plot 123, Admiralty Way, Lekki Phase 1, Lagos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guest Checkout Information */}
                  {!isAuthenticated && (
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
                  {/* Payment Method */}
                  <div className="bg-white rounded-3xl shadow-premium p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all ${
                          paymentMethod === 'card'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCardIcon className="w-6 h-6 text-orange-500" />
                        <span className="font-medium text-gray-900">Debit/Credit Card</span>
                      </button>
                      

                    </div>
                  </div>

                  {/* Card Details */}
                  {paymentMethod === 'card' && (
                    <div className="bg-white rounded-3xl shadow-premium p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Card Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            value={paymentInfo.cardNumber}
                            onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date *
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.expiryDate}
                              onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV *
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.cvv}
                              onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            value={paymentInfo.cardName}
                            onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardName: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Name on card"
                          />
                        </div>
                      </div>
                    </div>
                  )}


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
              {renderOrderSummary()}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckoutPage