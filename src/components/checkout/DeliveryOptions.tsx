import { MapPinIcon } from '@heroicons/react/24/outline'

interface DeliveryOptionsProps {
  deliveryType: 'delivery' | 'pickup'
  onDeliveryTypeChange: (type: 'delivery' | 'pickup') => void
}

const DeliveryOptions = ({ deliveryType, onDeliveryTypeChange }: DeliveryOptionsProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-premium p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Option</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onDeliveryTypeChange('delivery')}
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
          onClick={() => onDeliveryTypeChange('pickup')}
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
  )
}

export default DeliveryOptions