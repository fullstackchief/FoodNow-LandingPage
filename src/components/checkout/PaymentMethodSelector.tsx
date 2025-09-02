import { CreditCardIcon } from '@heroicons/react/24/outline'

interface PaymentInfo {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardName: string
}

interface PaymentMethodSelectorProps {
  paymentMethod: 'card' | 'cash' | 'transfer'
  paymentInfo: PaymentInfo
  onPaymentMethodChange: (method: 'card' | 'cash' | 'transfer') => void
  onPaymentInfoChange: (info: PaymentInfo) => void
}

const PaymentMethodSelector = ({ 
  paymentMethod, 
  paymentInfo, 
  onPaymentMethodChange, 
  onPaymentInfoChange 
}: PaymentMethodSelectorProps) => {
  const handlePaymentInfoChange = (field: keyof PaymentInfo, value: string) => {
    onPaymentInfoChange({
      ...paymentInfo,
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div className="bg-white rounded-3xl shadow-premium p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
        <div className="space-y-3">
          <button
            onClick={() => onPaymentMethodChange('card')}
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
                onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
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
                  onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
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
                  onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
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
                onChange={(e) => handlePaymentInfoChange('cardName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Name on card"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentMethodSelector