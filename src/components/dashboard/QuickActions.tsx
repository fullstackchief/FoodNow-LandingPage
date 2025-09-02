'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowPathIcon,
  MapPinIcon,
  HeartIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  GiftIcon,
  PhoneIcon,
  CreditCardIcon,
  TruckIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import DashboardCard from '@/components/ui/DashboardCard'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  color: 'orange' | 'green' | 'gray'
  premium?: boolean
}

const QuickActions = () => {
  const { user } = useAuth()

  const quickActions: QuickAction[] = [
    {
      id: 'reorder',
      title: 'Reorder Favorites',
      description: 'Order again from your favorite restaurants',
      icon: <ArrowPathIcon className="w-5 h-5" />,
      href: '/dashboard/favorites',
      color: 'orange',
      premium: true
    },
    {
      id: 'track',
      title: 'Track Orders',
      description: 'View your active and recent orders',
      icon: <TruckIcon className="w-5 h-5" />,
      href: '/dashboard/orders',
      badge: user?.total_orders || 0,
      color: 'green'
    },
    {
      id: 'browse',
      title: 'Browse Nearby',
      description: 'Discover restaurants in your area',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      href: '/explore',
      color: 'orange'
    },
    {
      id: 'rewards',
      title: 'Claim Rewards',
      description: 'Use your loyalty points',
      icon: <GiftIcon className="w-5 h-5" />,
      href: '/dashboard/rewards',
      badge: user?.loyalty_points || 0,
      color: 'green',
      premium: true
    },
    {
      id: 'addresses',
      title: 'Manage Addresses',
      description: 'Update delivery locations',
      icon: <MapPinIcon className="w-5 h-5" />,
      href: '/dashboard/addresses',
      color: 'gray'
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      description: 'Manage cards and payments',
      icon: <CreditCardIcon className="w-5 h-5" />,
      href: '/dashboard/payment-methods',
      color: 'gray'
    },
    {
      id: 'favorites',
      title: 'Saved Favorites',
      description: 'Your liked restaurants and dishes',
      icon: <HeartIcon className="w-5 h-5" />,
      href: '/dashboard/favorites',
      color: 'orange'
    },
    {
      id: 'support',
      title: 'Get Help',
      description: '24/7 customer support',
      icon: <PhoneIcon className="w-5 h-5" />,
      href: '/support',
      color: 'gray'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0, 1] as [number, number, number, number]
      }
    }
  }

  return (
    <DashboardCard
      title="Quick Actions"
      subtitle="Everything you need at your fingertips"
      icon={<StarIcon className="w-6 h-6 text-orange-600" />}
      className="h-fit"
      variant="premium"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {quickActions.map((action) => {
          const colorClasses = {
            orange: {
              bg: 'hover:bg-orange-50',
              icon: 'text-orange-600 bg-orange-100',
              text: 'text-gray-900',
              badge: 'bg-orange-500 text-white'
            },
            green: {
              bg: 'hover:bg-green-50',
              icon: 'text-green-600 bg-green-100',
              text: 'text-gray-900',
              badge: 'bg-green-500 text-white'
            },
            gray: {
              bg: 'hover:bg-gray-50',
              icon: 'text-gray-600 bg-gray-100',
              text: 'text-gray-900',
              badge: 'bg-gray-500 text-white'
            }
          }

          return (
            <motion.div key={action.id} variants={itemVariants}>
              <Link href={action.href}>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    group relative flex items-center p-4 rounded-xl 
                    transition-all duration-300 cursor-pointer
                    border border-transparent hover:border-gray-200
                    ${colorClasses[action.color].bg}
                    ${action.premium ? 'bg-gradient-to-r from-white to-orange-50/30' : ''}
                  `}
                >
                  {/* Premium Shimmer Effect */}
                  {action.premium && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out rounded-xl"></div>
                  )}

                  {/* Icon */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    ${colorClasses[action.color].icon}
                    group-hover:scale-110 transition-transform duration-300
                    relative z-10
                  `}>
                    {action.icon}
                    {action.premium && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-semibold ${colorClasses[action.color].text}`}>
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors">
                          {action.description}
                        </p>
                      </div>
                      
                      {/* Badge */}
                      {action.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                          className={`
                            px-2 py-1 rounded-lg text-xs font-bold
                            ${colorClasses[action.color].badge}
                            min-w-[24px] text-center
                          `}
                        >
                          {typeof action.badge === 'number' && action.badge > 999 
                            ? '999+' 
                            : action.badge}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 ml-3 relative z-10">
                    <motion.div
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowPathIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors rotate-45" />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}

        {/* Emergency Contact Card */}
        <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">Need Help?</h4>
                <p className="text-orange-100 text-sm mt-1">24/7 Support Available</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center cursor-pointer"
              >
                <PhoneIcon className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardCard>
  )
}

export default QuickActions