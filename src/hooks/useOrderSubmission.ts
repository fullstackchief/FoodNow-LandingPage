import { useState } from 'react'
import { createOrder } from '@/lib/orderService'
import { initializePayment } from '@/lib/payment-client'
import { CartState } from '@/store/slices/cartSlice'

interface DeliveryInfo {
  address: string
  apartment: string
  phone: string
  instructions: string
}

interface User {
  id: string
  email?: string
  first_name?: string
  last_name?: string
}

interface OrderSubmissionData {
  cartState: CartState
  deliveryInfo: DeliveryInfo
  paymentMethod: 'card' | 'cash' | 'transfer'
  user: User
  getCartTotal: () => number
}

export const useOrderSubmission = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  const submitOrder = async ({ 
    cartState, 
    deliveryInfo, 
    paymentMethod, 
    user, 
    getCartTotal 
  }: OrderSubmissionData) => {
    if (!cartState.restaurant || cartState.items.length === 0) {
      setOrderError('Your cart is empty')
      return { success: false }
    }

    if (!deliveryInfo.address || !deliveryInfo.phone) {
      setOrderError('Please provide delivery address and phone number')
      return { success: false }
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
        return { success: false }
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
          return { success: false }
        }

        // Redirect to Paystack payment page
        window.location.href = paymentInit.authorization_url
        return { success: true, orderId: order.id, paymentUrl: paymentInit.authorization_url }
      } else {
        // Cash payment - go directly to confirmation
        return { success: true, orderId: order.id, showConfirmation: true }
      }

    } catch (error) {
      console.error('Order submission error:', error)
      setOrderError('An unexpected error occurred')
      return { success: false }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    orderError,
    createdOrderId,
    submitOrder,
    setOrderError
  }
}