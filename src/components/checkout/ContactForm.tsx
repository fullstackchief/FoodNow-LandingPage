import { MapPinIcon } from '@heroicons/react/24/outline'

interface DeliveryInfo {
  phone: string
}

interface ContactFormProps {
  deliveryInfo: DeliveryInfo
  onPhoneChange: (phone: string) => void
}

const ContactForm = ({ deliveryInfo, onPhoneChange }: ContactFormProps) => {
  return (
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
            onChange={(e) => onPhoneChange(e.target.value)}
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
  )
}

export default ContactForm