'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BellIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import EnhancedAddMenuItemModal from '@/components/ui/EnhancedAddMenuItemModal'
import OrderManagement from '@/components/ui/OrderManagement'

interface MenuItem {
  id: string
  name: string
  description: string
  basePrice: number
  portions: {
    small?: number
    regular?: number
    large?: number
  }
  addOns: {
    name: string
    price: number
  }[]
  dietaryTags: string[]
  preparationTime: number
  available: boolean
  spicy?: boolean
}

interface OrderItem {
  name: string
  quantity: number
  price: number
  customizations?: string[]
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed'
  orderTime: string
  deliveryType: string
  deliveryAddress?: string
}

const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 'item-1',
      name: 'Jollof Rice Special',
      description: 'Traditional Nigerian jollof rice with your choice of protein, served with plantain and coleslaw',
      basePrice: 2800,
      portions: {
        small: 2800,
        regular: 3500,
        large: 4200
      },
      addOns: [
        { name: 'Extra Chicken', price: 1000 },
        { name: 'Extra Beef', price: 1200 },
        { name: 'Extra Fish', price: 800 },
        { name: 'Fried Plantain', price: 500 },
        { name: 'Moin Moin', price: 600 }
      ],
      dietaryTags: ['Gluten-Free', 'Contains Dairy'],
      preparationTime: 25,
      available: true,
      spicy: true
    },
    {
      id: 'item-2',
      name: 'Pepper Soup',
      description: 'Spicy traditional Nigerian pepper soup with assorted meat or fish',
      basePrice: 3500,
      portions: {
        small: 3500,
        regular: 4200,
        large: 5000
      },
      addOns: [
        { name: 'Extra Meat', price: 1500 },
        { name: 'Extra Fish', price: 1000 },
        { name: 'Extra Pepper', price: 200 },
        { name: 'Yam', price: 800 }
      ],
      dietaryTags: ['Gluten-Free', 'Dairy-Free', 'Spicy'],
      preparationTime: 30,
      available: true,
      spicy: true
    },
    {
      id: 'item-3',
      name: 'Grilled Chicken & Rice',
      description: 'Perfectly grilled chicken breast served with coconut rice and steamed vegetables',
      basePrice: 4200,
      portions: {
        small: 4200,
        regular: 5000,
        large: 5800
      },
      addOns: [
        { name: 'Extra Chicken', price: 1500 },
        { name: 'Avocado Slices', price: 700 },
        { name: 'Extra Vegetables', price: 400 },
        { name: 'Spicy Sauce', price: 200 }
      ],
      dietaryTags: ['High Protein', 'Gluten-Free'],
      preparationTime: 20,
      available: false
    }
  ])
  
  const [orders] = useState<Order[]>([
    {
      id: 'ORD001',
      customerName: 'Adebayo Johnson',
      customerPhone: '+234 803 456 7890',
      items: [
        { name: 'Jollof Rice Special', quantity: 2, price: 3500, customizations: ['Large', 'Extra Chicken'] },
        { name: 'Chapman', quantity: 2, price: 800 }
      ],
      total: 8600,
      status: 'pending',
      orderTime: '2:30 PM',
      deliveryType: 'Delivery',
      deliveryAddress: '15 Allen Avenue, Ikeja'
    },
    {
      id: 'ORD002',
      customerName: 'Sarah Okafor',
      customerPhone: '+234 901 234 5678',
      items: [
        { name: 'Pepper Soup', quantity: 1, price: 4200, customizations: ['Regular', 'Extra Fish'] }
      ],
      total: 4200,
      status: 'preparing',
      orderTime: '2:15 PM',
      deliveryType: 'Pickup'
    }
  ])

  const [showAddMenuModal, setShowAddMenuModal] = useState(false)

  const stats = {
    todayOrders: orders.length,
    todayRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    monthlyOrders: 847,
    monthlyRevenue: 2450000,
    averageRating: 4.8,
    activeMenuItems: menuItems.filter(item => item.available).length
  }

  // const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
  //   setOrders(prev => prev.map(order => 
  //     order.id === orderId ? { ...order, status: newStatus } : order
  //   ))
  // }

  const addMenuItem = (enhancedItem: any) => {
    const menuItem: MenuItem = {
      id: enhancedItem.id,
      name: enhancedItem.name,
      description: enhancedItem.description,
      basePrice: enhancedItem.basePrice,
      portions: {
        small: enhancedItem.portions.small?.price,
        regular: enhancedItem.portions.standard?.price,
        large: enhancedItem.portions.large?.price
      },
      addOns: enhancedItem.addOns.map((addon: any) => ({
        name: addon.name,
        price: addon.price
      })),
      dietaryTags: enhancedItem.dietaryTags,
      preparationTime: enhancedItem.preparationTime,
      available: enhancedItem.isAvailable,
      spicy: enhancedItem.spicy
    }
    setMenuItems(prev => [...prev, menuItem])
  }

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ))
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'accepted': return 'text-blue-600 bg-blue-100'
      case 'preparing': return 'text-orange-600 bg-orange-100'
      case 'ready': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">{stats.todayOrders}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Today&apos;s Orders</h3>
          <p className="text-xs text-green-600 mt-1">+12% from yesterday</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">₦{stats.todayRevenue.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Today&apos;s Revenue</h3>
          <p className="text-xs text-green-600 mt-1">+8% from yesterday</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <StarIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">{stats.averageRating}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
          <p className="text-xs text-green-600 mt-1">From 156 reviews</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-premium p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddMenuModal(true)}
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors"
          >
            <PlusIcon className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Add Menu Item</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">View Orders</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-colors">
            <ChartBarIcon className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-700">Analytics</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors">
            <CogIcon className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Recent Orders Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-premium p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <h4 className="font-semibold text-gray-900">#{order.id}</h4>
                <p className="text-sm text-gray-600">{order.customerName}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₦{order.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{order.orderTime}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  const renderMenu = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <button
          onClick={() => setShowAddMenuModal(true)}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add New Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl shadow-premium p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  {item.available ? (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Unavailable
                    </span>
                  )}
                  {item.spicy && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      🌶️
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl font-bold text-green-600">
                    ₦{item.basePrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                
                {/* Dietary Tags */}
                {item.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.dietaryTags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Portion Sizes */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Portion Sizes:</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {item.portions.small && (
                      <div className="text-center">
                        <p className="font-medium text-gray-700">Small</p>
                        <p className="text-green-600">₦{item.portions.small.toLocaleString()}</p>
                      </div>
                    )}
                    {item.portions.regular && (
                      <div className="text-center">
                        <p className="font-medium text-gray-700">Regular</p>
                        <p className="text-green-600">₦{item.portions.regular.toLocaleString()}</p>
                      </div>
                    )}
                    {item.portions.large && (
                      <div className="text-center">
                        <p className="font-medium text-gray-700">Large</p>
                        <p className="text-green-600">₦{item.portions.large.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add-ons */}
                <div className="bg-orange-50 rounded-xl p-3 mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Add-ons:</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {item.addOns.map((addon, addonIndex) => (
                      <div key={addonIndex} className="flex justify-between">
                        <span className="text-gray-700">{addon.name}</span>
                        <span className="text-green-600 font-medium">+₦{addon.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{item.preparationTime} min prep</span>
                </div>
              </div>
            </div>

            {/* Item Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => toggleMenuItemAvailability(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  item.available
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.available ? (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    <span>Available</span>
                  </>
                ) : (
                  <>
                    <EyeSlashIcon className="w-4 h-4" />
                    <span>Unavailable</span>
                  </>
                )}
              </button>

              <div className="flex space-x-2">
                <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { id: 'menu', label: 'Menu', icon: CogIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-to-r from-green-50 to-green-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Mama Cass Kitchen</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Open
                  </span>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-gray-900">{stats.averageRating}</span>
                  </div>
                  <span className="text-gray-600 text-sm">Nigerian Cuisine</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="p-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <BellIcon className="w-6 h-6 text-gray-600" />
                </button>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{orders.filter(o => o.status === 'pending').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'orders' && <OrderManagement restaurantId="rest-001" />}
          {activeTab === 'menu' && renderMenu()}
          {activeTab === 'analytics' && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics Coming Soon</h3>
              <p className="text-gray-600">Detailed analytics and insights will be available here.</p>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Add Menu Item Modal */}
      <EnhancedAddMenuItemModal
        isOpen={showAddMenuModal}
        onClose={() => setShowAddMenuModal(false)}
        onAddItem={addMenuItem}
      />
    </div>
  )
}

export default RestaurantDashboard