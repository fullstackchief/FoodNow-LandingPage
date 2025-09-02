interface DeliveryInfo {
  address: string
  apartment: string
  phone: string
  instructions: string
}

interface DeliveryFormProps {
  deliveryInfo: DeliveryInfo
  onDeliveryInfoChange: (info: DeliveryInfo) => void
}

const DeliveryForm = ({ deliveryInfo, onDeliveryInfoChange }: DeliveryFormProps) => {
  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    onDeliveryInfoChange({
      ...deliveryInfo,
      [field]: value
    })
  }

  return (
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
            onChange={(e) => handleInputChange('address', e.target.value)}
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
            onChange={(e) => handleInputChange('apartment', e.target.value)}
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
            onChange={(e) => handleInputChange('phone', e.target.value)}
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
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 h-24"
            placeholder="Add delivery instructions..."
          />
        </div>
      </div>
    </div>
  )
}

export default DeliveryForm