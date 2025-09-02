'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  Heart, 
  MapPin, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  Star
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function UserMenu() {
  const { user, supabaseUser, logout, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
        >
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.first_name?.charAt(0) || 'U'}{user.last_name?.charAt(0) || ''}
        </div>
        <span className="hidden md:block text-gray-700 font-medium">
          {user.first_name || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.first_name?.charAt(0) || 'U'}{user.last_name?.charAt(0) || ''}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.first_name || 'User'} {user.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-500">{supabaseUser?.email || 'No email'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600 capitalize">
                      {user.user_role} • Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="w-4 h-4 relative">
                  <div className="w-3 h-3 border-2 border-gray-400 rounded"></div>
                  <div className="w-2 h-1 bg-gray-400 absolute top-1 left-0.5"></div>
                </div>
                <span>My Orders</span>
              </Link>

              <Link
                href="/favorites"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Link>

              <Link
                href="/addresses"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>Addresses</span>
              </Link>

              <Link
                href="/payment-methods"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Methods</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>

              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </Link>

              <Link
                href="/help"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}