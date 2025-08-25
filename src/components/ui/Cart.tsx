'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'
import { useRouter } from 'next/navigation'

const Cart = () => {
  const { 
    state, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    setCartOpen, 
    getCartTotal, 
    getCartItemCount 
  } = useCart()
  
  const router = useRouter()
  const deliveryFee = state.restaurant?.deliveryFee || 0
  const subtotal = getCartTotal()
  const total = subtotal + deliveryFee

  const handleCheckout = () => {
    setCartOpen(false)
    router.push('/checkout')
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  return (
    <Transition.Root show={state.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setCartOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                          Your Cart
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={() => setCartOpen(false)}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Cart Items */}
                      <div className="mt-8">
                        {state.items.length === 0 ? (
                          <div className="text-center py-16">
                            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
                            <button
                              onClick={() => setCartOpen(false)}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                            >
                              Continue Shopping
                            </button>
                          </div>
                        ) : (
                          <div className="flow-root">
                            {/* Restaurant Info */}
                            {state.restaurant && (
                              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{state.restaurant.name}</h4>
                                    <p className="text-sm text-gray-600">
                                      Delivery: {state.restaurant.deliveryTime} • {formatPrice(state.restaurant.deliveryFee)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={clearCart}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                  >
                                    Clear All
                                  </button>
                                </div>
                              </div>
                            )}

                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {state.items.map((item) => (
                                <li key={`${item.id}-${JSON.stringify(item.customizations)}`} className="flex py-6">
                                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover object-center"
                                      />
                                    ) : (
                                      <span className="text-2xl">🍽️</span>
                                    )}
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3 className="line-clamp-1">{item.name}</h3>
                                        <p className="ml-4 font-bold">{formatPrice(item.price * item.quantity)}</p>
                                      </div>
                                      
                                      {item.customizations && item.customizations.length > 0 && (
                                        <p className="mt-1 text-sm text-gray-500">
                                          {item.customizations.join(', ')}
                                        </p>
                                      )}
                                      
                                      <p className="text-sm text-gray-500">
                                        {formatPrice(item.price)} each
                                      </p>
                                    </div>
                                    
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-3">
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                          className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                          disabled={item.quantity <= 1}
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        
                                        <span className="font-semibold text-gray-900 min-w-[20px] text-center">
                                          {item.quantity}
                                        </span>
                                        
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                          className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer with totals and checkout */}
                    {state.items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        {/* Order Summary */}
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal ({getCartItemCount()} items)</span>
                            <span className="font-medium">{formatPrice(subtotal)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span className="font-medium">{formatPrice(deliveryFee)}</span>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between">
                              <span className="text-base font-semibold text-gray-900">Total</span>
                              <span className="text-xl font-bold text-orange-600">{formatPrice(total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Minimum Order Check */}
                        {state.restaurant && subtotal < state.restaurant.minimumOrder && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm text-yellow-800">
                              Minimum order: {formatPrice(state.restaurant.minimumOrder)}. 
                              Add {formatPrice(state.restaurant.minimumOrder - subtotal)} more to continue.
                            </p>
                          </div>
                        )}

                        {/* Checkout Button */}
                        <button
                          onClick={handleCheckout}
                          disabled={!!(state.restaurant && subtotal < state.restaurant.minimumOrder)}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
                        >
                          {state.restaurant && subtotal < state.restaurant.minimumOrder 
                            ? `Add ${formatPrice(state.restaurant.minimumOrder - subtotal)} more`
                            : `Proceed to Checkout • ${formatPrice(total)}`
                          }
                        </button>

                        <p className="mt-4 text-center text-sm text-gray-500">
                          Free delivery on orders over ₦5,000
                        </p>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default Cart