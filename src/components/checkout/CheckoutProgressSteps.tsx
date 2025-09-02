import { 
  UserIcon,
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface CheckoutProgressStepsProps {
  currentStep: number
}

const CheckoutProgressSteps = ({ currentStep }: CheckoutProgressStepsProps) => {
  const steps = [
    { step: 1, label: 'Details', icon: UserIcon },
    { step: 2, label: 'Payment', icon: CreditCardIcon },
    { step: 3, label: 'Confirmation', icon: CheckCircleIcon }
  ]

  return (
    <section className="bg-white pb-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-8">
          {steps.map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                currentStep >= step 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`font-medium ${
                currentStep >= step ? 'text-orange-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {step < 3 && (
                <div className={`w-8 h-0.5 ${
                  currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CheckoutProgressSteps