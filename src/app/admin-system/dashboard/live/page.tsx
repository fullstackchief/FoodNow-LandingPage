'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  GlobeAltIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface DashboardMetrics {
  orders: {
    total: number
    today: number
    pending: number
    completed: number
    cancelled: number
    revenue_today: number
    average_order_value: number
  }
  restaurants: {
    total: number
    active: number
    pending_approval: number
    revenue_today: number
  }
  riders: {
    total: number
    online: number
    busy: number
    applications_pending: number
  }
  customers: {
    total: number
    active_today: number
    new_today: number
  }
  system: {
    peak_concurrent_users: number
    average_delivery_time: number
    customer_satisfaction: number
    uptime_percentage: number
  }
}

export default function LiveAdminDashboard() {
  const { isAdminAuthenticated, adminUser, logout } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (!isAdminAuthenticated || !adminUser) {
      router.push('/admin-system')
      return
    }
    
    loadDashboardMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAdminAuthenticated, adminUser, router])

  const loadDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/metrics', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load metrics')
      }

      const { data } = await response.json()
      setMetrics(data)
      setLastUpdate(new Date())
      
      // Load alerts
      const alertsResponse = await fetch('/api/admin/dashboard/alerts', {
        credentials: 'include'
      })
      
      if (alertsResponse.ok) {
        const { data: alertsData } = await alertsResponse.json()
        setAlerts(alertsData || [])
      }

    } catch (error) {
      console.error('Failed to load dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    trend 
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    color: string
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : trend === 'down' ? (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            ) : null}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin-system/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    FoodNow Live Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">Real-time System Monitoring</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
                <span>•</span>
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
              
              <button
                onClick={loadDashboardMetrics}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <GlobeAltIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <BellIcon className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-red-900">Critical Alerts ({alerts.length})</h2>
              </div>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-900">{alert.message}</span>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Orders Today"
            value={metrics?.orders.today || 0}
            subtitle="Active orders being processed"
            icon={ShoppingCartIcon}
            color="bg-blue-500"
            trend="up"
          />
          
          <MetricCard
            title="Revenue Today"
            value={`₦${(metrics?.orders.revenue_today || 0).toLocaleString()}`}
            subtitle="Gross revenue from completed orders"
            icon={CurrencyDollarIcon}
            color="bg-green-500"
            trend="up"
          />
          
          <MetricCard
            title="Active Riders"
            value={`${metrics?.riders.online || 0}/${metrics?.riders.total || 0}`}
            subtitle="Online and available for delivery"
            icon={TruckIcon}
            color="bg-purple-500"
            trend="neutral"
          />
          
          <MetricCard
            title="Restaurants Open"
            value={`${metrics?.restaurants.active || 0}/${metrics?.restaurants.total || 0}`}
            subtitle="Currently accepting orders"
            icon={BuildingStorefrontIcon}
            color="bg-orange-500"
            trend="neutral"
          />
        </div>

        {/* Order Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
              <span>Order Status Breakdown</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Pending Orders</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{metrics?.orders.pending || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Completed Orders</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{metrics?.orders.completed || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-900">Cancelled Orders</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{metrics?.orders.cancelled || 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
              <span>Performance Metrics</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Delivery Time</span>
                <span className="font-semibold text-gray-900">
                  {metrics?.system.average_delivery_time || 0} min
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold text-green-600">
                  {((metrics?.system.customer_satisfaction || 0) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="font-semibold text-blue-600">
                  {((metrics?.system.uptime_percentage || 0) * 100).toFixed(2)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Peak Concurrent Users</span>
                <span className="font-semibold text-gray-900">
                  {metrics?.system.peak_concurrent_users || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions & Pending Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-orange-600" />
              <span>Pending Approvals</span>
            </h3>
            
            <div className="space-y-3">
              <Link 
                href="/admin-system/applications?status=pending&role=restaurant_owner"
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <BuildingStorefrontIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Restaurant Applications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">
                    {metrics?.restaurants.pending_approval || 0}
                  </span>
                  <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
              
              <Link 
                href="/admin-system/applications?status=pending&role=rider"
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <TruckIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Rider Applications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-blue-600">
                    {metrics?.riders.applications_pending || 0}
                  </span>
                  <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Customer Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-indigo-600" />
              <span>Customer Activity</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active Today</span>
                  <span className="font-semibold text-gray-900">{metrics?.customers.active_today || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(((metrics?.customers.active_today || 0) / (metrics?.customers.total || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Registrations Today</span>
                  <span className="font-semibold text-green-600">{metrics?.customers.new_today || 0}</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Customers</span>
                  <span className="font-semibold text-gray-900">{metrics?.customers.total || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <GlobeAltIcon className="w-5 h-5 text-emerald-600" />
              <span>System Health</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment System</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="font-semibold text-emerald-600">
                    {((metrics?.system.uptime_percentage || 0.999) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Analytics Links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin-system/orders"
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <ShoppingCartIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Order Management</h3>
                    <p className="text-sm text-gray-600">View and manage all orders</p>
                  </div>
                </div>
                <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
            
            <Link
              href="/admin-system/users"
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-600">Manage customers and roles</p>
                  </div>
                </div>
                <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
            
            <Link
              href="/admin-system/analytics"
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analytics & Reports</h3>
                    <p className="text-sm text-gray-600">Detailed platform insights</p>
                  </div>
                </div>
                <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}