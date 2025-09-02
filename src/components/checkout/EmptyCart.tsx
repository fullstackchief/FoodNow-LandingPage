import Link from 'next/link'

const EmptyCart = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-gray-400">🛒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some delicious items to proceed to checkout</p>
        <Link href="/explore">
          <button className="btn-primary">
            Browse Restaurants
          </button>
        </Link>
      </div>
    </div>
  )
}

export default EmptyCart