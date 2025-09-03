'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  UserIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  ShoppingCartIcon as CartIconSolid,
  UserIcon as UserIconSolid,
  ClockIcon as OrderIconSolid
} from '@heroicons/react/24/solid'
import { useCartRedux } from '@/hooks/useCartRedux'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
  requireAuth?: boolean
}

export default function MobileNavigation() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { state: cartState } = useCartRedux()
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    const count = cartState.items.reduce((total, item) => total + item.quantity, 0)
    setCartItemCount(count)
  }, [cartState.items])

  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid
    },
    {
      name: 'Search',
      href: '/search',
      icon: MagnifyingGlassIcon,
      activeIcon: SearchIconSolid
    },
    {
      name: 'Cart',
      href: '/checkout',
      icon: ShoppingCartIcon,
      activeIcon: CartIconSolid,
      badge: cartItemCount
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ClockIcon,
      activeIcon: OrderIconSolid,
      requireAuth: true
    },
    {
      name: 'Profile',
      href: isAuthenticated ? '/profile' : '/auth/login',
      icon: UserIcon,
      activeIcon: UserIconSolid
    }
  ]

  // Don't show mobile nav on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 mobile-safe-area z-50 md:hidden">
      <nav className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          // Skip auth-required items if not authenticated
          if (item.requireAuth && !isAuthenticated) {
            return null
          }

          const isActive = pathname === item.href
          const IconComponent = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl transition-colors relative mobile-touch-optimized"
              aria-label={`Navigate to ${item.name}`}
            >
              <div className="relative">
                <IconComponent 
                  className={`w-6 h-6 transition-colors ${
                    isActive 
                      ? 'text-orange-600' 
                      : 'text-gray-600 hover:text-orange-500'
                  }`} 
                />
                
                {/* Badge for cart items */}
                {item.badge && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </div>
              
              <span 
                className={`text-xs font-medium mt-1 transition-colors ${
                  isActive 
                    ? 'text-orange-600' 
                    : 'text-gray-600'
                }`}
              >
                {item.name}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// Mobile navigation spacer component
export function MobileNavSpacer() {
  const pathname = usePathname()

  // Don't add spacer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return <div className="h-20 md:hidden" />
}