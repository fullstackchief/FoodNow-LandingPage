import { useState } from 'react'
import { 
  ClockIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { CartState } from '@/store/slices/cartSlice'
import { ConfirmModal } from '@/components/ui/Modal'

interface OrderSummaryProps {
  cartState: CartState
  subtotal: number
  deliveryFee: number
  serviceFee: number
  total: number
  deliveryType: string
  onQuantityUpdate: (itemId: string, change: number) => void
  onRemoveItem: (itemId: string, customizations?: string[]) => void
  onEditItem?: (itemId: string, customizations?: string[]) => void
  dynamicPricing?: any
  isLoadingPricing?: boolean
}

const OrderSummary = ({ 
  cartState, 
  subtotal, 
  deliveryFee, 
  serviceFee, 
  total, 
  deliveryType,
  onQuantityUpdate,
  onRemoveItem,
  onEditItem,
  dynamicPricing,
  isLoadingPricing 
}: OrderSummaryProps) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{id: string, name: string, customizations?: string[]}>()
  
  const handleRemoveClick = (itemId: string, itemName: string, customizations?: string[]) => {
    setItemToRemove({ id: itemId, name: itemName, customizations })
    setShowRemoveConfirm(true)
  }
  
  const handleConfirmRemove = () => {
    if (itemToRemove) {
      console.log('Removing item:', { id: itemToRemove.id, customizations: itemToRemove.customizations })
      onRemoveItem(itemToRemove.id, itemToRemove.customizations)
      setShowRemoveConfirm(false)
      setItemToRemove(undefined)
    }
  }
  
  // Debug cart state
  console.log('OrderSummary detailed cart state:', cartState.items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    customizations: item.customizations,
    customizationsType: typeof item.customizations,
    customizationsStringified: JSON.stringify(item.customizations || [])
  })))
  
  return (
    <div className="bg-white rounded-3xl shadow-premium p-4 md:p-6 sticky top-24 border border-gray-100">
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
      <div className="space-y-6 mb-8">
        {cartState.items.map((item) => (
          <div key={`${item.id}-${JSON.stringify(item.customizations || [])}`} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 text-base">{item.name}</h5>
                {item.customizations && item.customizations.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1 bg-white px-2 py-1 rounded-lg inline-block">
                    {item.customizations.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-2 md:ml-4 flex-shrink-0">
                <button
                  onClick={() => onQuantityUpdate(item.id, -1)}
                  className="p-2 md:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  disabled={item.quantity <= 1}
                  title="Decrease quantity"
                >
                  <MinusIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 px-3 py-2 bg-white rounded-lg min-w-[44px] text-center border border-gray-200 shadow-sm">{item.quantity}</span>
                <button
                  onClick={() => onQuantityUpdate(item.id, 1)}
                  className="p-2 md:p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm touch-manipulation"
                  title="Increase quantity"
                >
                  <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                {/* Remove Item Button */}
                <button
                  onClick={() => handleRemoveClick(item.id, item.name, item.customizations)}
                  className="p-2 md:p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors ml-1 shadow-sm touch-manipulation"
                  title="Remove item from cart"
                >
                  <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                {/* Edit Customizations Button */}
                {onEditItem && item.customizations && item.customizations.length > 0 && (
                  <button
                    onClick={() => onEditItem(item.id, item.customizations)}
                    className="p-2 md:p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors shadow-sm touch-manipulation"
                    title="Edit customizations"
                  >
                    <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-gray-200">
              <span className="text-gray-600 font-medium">₦{item.price.toLocaleString()} each</span>
              <span className="font-bold text-gray-900 text-lg">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Surge Pricing Notification */}
      {dynamicPricing?.surgeInfo?.isActive && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800">
                {dynamicPricing.surgeInfo.displayMessage}
              </p>
              <p className="text-xs text-orange-600">
                Estimated normal pricing: {dynamicPricing.surgeInfo.estimatedNormalTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Order Total</h4>
        {isLoadingPricing && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-sm text-gray-600">Calculating pricing...</span>
          </div>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-gray-900 font-semibold">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Service fee</span>
            <span className="text-gray-900 font-semibold">
              ₦{serviceFee.toLocaleString()}
              {dynamicPricing?.surgeInfo?.isActive && dynamicPricing.originalPrice.serviceFee !== serviceFee && (
                <span className="text-xs text-orange-600 ml-1">
                  (was ₦{dynamicPricing.originalPrice.serviceFee.toLocaleString()})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">{deliveryType === 'delivery' ? 'Delivery fee' : 'Pickup'}</span>
            <span className="text-gray-900 font-semibold">
              {deliveryFee === 0 ? (
                <span className="text-green-600 font-bold">Free</span>
              ) : (
                <>
                  ₦{deliveryFee.toLocaleString()}
                  {dynamicPricing?.surgeInfo?.isActive && dynamicPricing.originalPrice.deliveryFee !== deliveryFee && (
                    <span className="text-xs text-orange-600 ml-1">
                      (was ₦{dynamicPricing.originalPrice.deliveryFee.toLocaleString()})
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          {dynamicPricing?.adjustedPrice?.surgeAmount > 0 && (
            <div className="flex justify-between items-center text-orange-600">
              <span className="text-sm font-medium">Surge pricing</span>
              <span className="text-sm font-semibold">+₦{dynamicPricing.adjustedPrice.surgeAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-gray-300">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-orange-600">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Item"
        description={`Are you sure you want to remove "${itemToRemove?.name}" from your cart?`}
        confirmText="Remove"
        cancelText="Keep Item"
        variant="secondary"
      />
    </div>
  )
}

export default OrderSummary