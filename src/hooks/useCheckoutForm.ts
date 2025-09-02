import { useState, useEffect } from 'react'

interface DeliveryInfo {
  address: string
  apartment: string
  phone: string
  instructions: string
}

interface PaymentInfo {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardName: string
}

interface CheckoutFormData {
  deliveryInfo: DeliveryInfo
  paymentInfo: PaymentInfo
  deliveryType: 'delivery' | 'pickup'
  paymentMethod: 'card' | 'cash' | 'transfer'
}

const initialDeliveryInfo: DeliveryInfo = {
  address: '',
  apartment: '',
  phone: '',
  instructions: ''
}

const initialPaymentInfo: PaymentInfo = {
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardName: ''
}

export const useCheckoutForm = () => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>(initialDeliveryInfo)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(initialPaymentInfo)
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card')

  // Restore form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('checkoutFormData')
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData)
        setDeliveryInfo(formData.deliveryInfo || initialDeliveryInfo)
        setPaymentInfo(formData.paymentInfo || initialPaymentInfo)
        setDeliveryType(formData.deliveryType || 'delivery')
        setPaymentMethod(formData.paymentMethod || 'card')
        localStorage.removeItem('checkoutFormData') // Clean up after restoration
      } catch (error) {
        console.warn('Failed to restore form data:', error)
      }
    }
  }, [])

  // Save form data to localStorage
  const saveFormData = () => {
    const formData: CheckoutFormData = {
      deliveryInfo,
      paymentInfo,
      deliveryType,
      paymentMethod
    }
    localStorage.setItem('checkoutFormData', JSON.stringify(formData))
  }

  // Validate form data
  const validateForm = () => {
    if (!deliveryInfo.phone) return false
    if (deliveryType === 'delivery' && !deliveryInfo.address) return false
    if (paymentMethod === 'card') {
      return !!(paymentInfo.cardNumber && paymentInfo.expiryDate && paymentInfo.cvv && paymentInfo.cardName)
    }
    return true
  }

  return {
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
  }
}