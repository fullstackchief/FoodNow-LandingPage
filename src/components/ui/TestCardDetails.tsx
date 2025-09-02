'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline'

interface TestCard {
  id: string
  name: string
  number: string
  expiryDate: string
  cvv: string
  type: 'visa' | 'mastercard' | 'verve'
  scenario: 'success' | 'decline' | 'insufficient_funds' | 'invalid'
  description: string
  icon: string
}

const testCards: TestCard[] = [
  {
    id: 'visa_success',
    name: 'Test Success',
    number: '4084 0840 8408 4081',
    expiryDate: '12/30',
    cvv: '408',
    type: 'visa',
    scenario: 'success',
    description: 'Successful payment transaction',
    icon: '✅'
  },
  {
    id: 'mastercard_success',
    name: 'Test Success',
    number: '5399 8383 8383 8381',
    expiryDate: '12/30', 
    cvv: '470',
    type: 'mastercard',
    scenario: 'success',
    description: 'Successful Mastercard payment',
    icon: '✅'
  },
  {
    id: 'verve_success',
    name: 'Test Success',
    number: '5060 6606 6606 6666 666',
    expiryDate: '12/30',
    cvv: '123',
    type: 'verve',
    scenario: 'success',
    description: 'Successful Verve card payment',
    icon: '✅'
  },
  {
    id: 'visa_decline',
    name: 'Test Decline',
    number: '4000 0000 0000 0002',
    expiryDate: '12/30',
    cvv: '123',
    type: 'visa',
    scenario: 'decline',
    description: 'Card will be declined',
    icon: '❌'
  },
  {
    id: 'insufficient_funds',
    name: 'Test Insufficient',
    number: '4000 0000 0000 9995',
    expiryDate: '12/30',
    cvv: '123',
    type: 'visa',
    scenario: 'insufficient_funds',
    description: 'Insufficient funds',
    icon: '💳'
  },
  {
    id: 'invalid_card',
    name: 'Test Invalid',
    number: '4000 0000 0000 0069',
    expiryDate: '12/30',
    cvv: '123',
    type: 'visa',
    scenario: 'invalid',
    description: 'Invalid card number',
    icon: '⚠️'
  }
]

interface TestCardDetailsProps {
  onCardSelect?: (card: TestCard) => void
  className?: string
  showTitle?: boolean
}

const TestCardDetails = ({ 
  onCardSelect, 
  className = '',
  showTitle = true 
}: TestCardDetailsProps) => {
  const [copiedCard, setCopiedCard] = useState<string | null>(null)

  const copyToClipboard = (text: string, cardId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCard(cardId)
      setTimeout(() => setCopiedCard(null), 2000)
    })
  }

  const getScenarioColor = (scenario: TestCard['scenario']) => {
    switch (scenario) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'decline':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'insufficient_funds':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'invalid':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCardTypeColor = (type: TestCard['type']) => {
    switch (type) {
      case 'visa':
        return 'text-blue-600 bg-blue-50'
      case 'mastercard':
        return 'text-red-600 bg-red-50'
      case 'verve':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-gray-200 p-4 ${className}`}
    >
      {showTitle && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCardIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Test Card Details</h3>
          </div>
          <p className="text-sm text-gray-600">
            Use these test cards for development and testing payments with Paystack
          </p>
        </div>
      )}

      <div className="space-y-3">
        {testCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{card.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {card.name} ({card.type.toUpperCase()})
                  </h4>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getScenarioColor(card.scenario)}`}>
                  {card.scenario.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCardTypeColor(card.type)}`}>
                  {card.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div 
                className="flex items-center space-x-1 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => copyToClipboard(card.number, `${card.id}_number`)}
              >
                <span className="font-mono text-gray-700">{card.number}</span>
                {copiedCard === `${card.id}_number` ? (
                  <CheckCircleIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              <div 
                className="flex items-center space-x-1 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => copyToClipboard(card.expiryDate, `${card.id}_expiry`)}
              >
                <span className="font-mono text-gray-700">{card.expiryDate}</span>
                {copiedCard === `${card.id}_expiry` ? (
                  <CheckCircleIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              <div 
                className="flex items-center space-x-1 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => copyToClipboard(card.cvv, `${card.id}_cvv`)}
              >
                <span className="font-mono text-gray-700">{card.cvv}</span>
                {copiedCard === `${card.id}_cvv` ? (
                  <CheckCircleIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>

            {onCardSelect && (
              <button
                onClick={() => onCardSelect(card)}
                className="w-full mt-2 py-1 px-3 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Use This Card
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs">ℹ️</span>
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Development Testing Notes:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Click any field to copy to clipboard</li>
              <li>• Use cardholder name: "Test User"</li>
              <li>• All test transactions are simulated</li>
              <li>• No real money is charged during testing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick fill buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => copyToClipboard('Test User', 'cardholder_name')}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
        >
          <span>Copy Cardholder Name</span>
          {copiedCard === 'cardholder_name' ? (
            <CheckCircleIcon className="w-3 h-3 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default TestCardDetails

// Export test cards for programmatic use
export { testCards, type TestCard }