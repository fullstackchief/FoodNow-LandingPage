'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ReceiptRefundIcon,
  PrinterIcon,
  ShareIcon,
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { devLog, prodLog } from '@/lib/logger'
import OptimizedImage from '@/components/ui/OptimizedImage'

interface ReceiptData {
  id: string
  order_number: string
  status: string
  total: number
  subtotal: number
  delivery_fee: number
  service_fee: number
  created_at: string
  delivered_at: string | null
  payment_method: string
  payment_reference: string
  delivery_info: any
  restaurant: {
    name: string
    address: string
    phone: string
    image_url: string
  }
  customer: {
    name: string
    phone: string
    email: string
  }
  items: {
    name: string
    quantity: number
    price: number
    total: number
    customizations?: string[]
  }[]
}

const ReceiptPage = () => {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.id as string
  
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!orderId) {
        setError('Order ID not found')
        setIsLoading(false)
        return
      }

      try {
        devLog.info('Fetching receipt data', { orderId })

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            restaurants!inner(
              name,
              address,
              phone_number,
              image_url
            ),
            order_items(
              quantity,
              price,
              customizations,
              menu_items!inner(
                name,
                image_url
              )
            ),
            payments(
              payment_method,
              paystack_reference
            )
          `)
          .eq('id', orderId)
          .single()

        if (fetchError) {
          prodLog.error('Failed to fetch receipt data', fetchError, { orderId })
          setError('Failed to load receipt')
          return
        }

        if (!data) {
          setError('Receipt not found')
          return
        }

        // Transform data for receipt
        const orderData = data as any
        const payment = orderData.payments?.[0]
        
        const receiptData: ReceiptData = {
          id: orderData.id,
          order_number: orderData.order_number,
          status: orderData.status,
          total: orderData.total,
          subtotal: orderData.subtotal || orderData.total,
          delivery_fee: orderData.delivery_fee || 0,
          service_fee: orderData.service_fee || 0,
          created_at: orderData.created_at,
          delivered_at: orderData.delivered_at,
          payment_method: payment?.payment_method || 'card',
          payment_reference: payment?.paystack_reference || '',
          delivery_info: orderData.delivery_info,
          restaurant: {
            name: orderData.restaurants.name,
            address: orderData.restaurants.address || '',
            phone: orderData.restaurants.phone_number || '',
            image_url: orderData.restaurants.image_url || '/images/restaurants/default.jpg'
          },
          customer: {
            name: `${user?.first_name} ${user?.last_name}` || 'Customer',
            phone: user?.phone || '',
            email: user?.email || ''
          },
          items: orderData.order_items.map((item: any) => ({
            name: item.menu_items.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            customizations: item.customizations || []
          }))
        }

        setReceipt(receiptData)
        
        prodLog.info('Receipt data loaded successfully', {
          orderId,
          orderNumber: receiptData.order_number
        })

      } catch (err) {
        prodLog.error('Error fetching receipt data', err, { orderId })
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReceiptData()
  }, [orderId, user])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FoodNow Order Receipt - ${receipt?.order_number}`,
          text: `Order receipt for ${receipt?.order_number}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Receipt URL copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading receipt...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptRefundIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard">
              <Button theme="customer" variant="primary">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8 print:hidden">
            <Link 
              href={`/orders/${receipt.id}`}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Order Details</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleShare}
                theme="customer"
                variant="outline"
                size="sm"
                icon={<ShareIcon className="w-4 h-4" />}
              >
                Share
              </Button>
              <Button
                onClick={handlePrint}
                theme="customer"
                variant="primary"
                size="sm"
                icon={<PrinterIcon className="w-4 h-4" />}
              >
                Print
              </Button>
            </div>
          </div>

          {/* Receipt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none"
          >
            
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ReceiptRefundIcon className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2">FoodNow Receipt</h1>
              <p className="text-orange-100">Order #{receipt.order_number}</p>
            </div>

            {/* Receipt Body */}
            <div className="p-8">
              
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{new Date(receipt.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Time:</span>
                      <span className="font-medium">{new Date(receipt.created_at).toLocaleTimeString()}</span>
                    </div>
                    {receipt.delivered_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivered:</span>
                        <span className="font-medium">{new Date(receipt.delivered_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{receipt.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{receipt.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{receipt.customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{receipt.customer.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Restaurant</h3>
                <div className="flex items-center space-x-4">
                  <OptimizedImage
                    src={receipt.restaurant.image_url}
                    alt={receipt.restaurant.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{receipt.restaurant.name}</h4>
                    {receipt.restaurant.address && (
                      <p className="text-sm text-gray-600 mt-1">{receipt.restaurant.address}</p>
                    )}
                    {receipt.restaurant.phone && (
                      <p className="text-sm text-gray-600 mt-1">{receipt.restaurant.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {receipt.delivery_info && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Delivery Address</h3>
                  <div className="text-sm text-gray-600">
                    <p>{receipt.delivery_info.address}</p>
                    {receipt.delivery_info.instructions && (
                      <p className="mt-1 text-gray-500">Instructions: {receipt.delivery_info.instructions}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Order Items</h3>
                <div className="space-y-4">
                  {receipt.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.customizations.join(', ')}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">₦{item.price.toLocaleString()} each</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{item.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals */}
              <div className="mb-8">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₦{receipt.subtotal.toLocaleString()}</span>
                  </div>
                  {receipt.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">₦{receipt.delivery_fee.toLocaleString()}</span>
                    </div>
                  )}
                  {receipt.service_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fee:</span>
                      <span className="font-medium">₦{receipt.service_fee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">₦{receipt.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{receipt.payment_method}</span>
                  </div>
                  {receipt.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs">{receipt.payment_reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-medium text-green-600">Paid</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Thank you for choosing FoodNow!</p>
                  <p>Questions? Contact support at support@foodnow.ng</p>
                  <p className="font-mono">Receipt generated on {new Date().toLocaleString()}</p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Print-only styles */}
          <style jsx global>{`
            @media print {
              body { margin: 0; }
              .print\\:hidden { display: none !important; }
              .print\\:shadow-none { box-shadow: none !important; }
              .print\\:rounded-none { border-radius: 0 !important; }
            }
          `}</style>

        </div>
      </div>
    </div>
  )
}

export default ReceiptPage