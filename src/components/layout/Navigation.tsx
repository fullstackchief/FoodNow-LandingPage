'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/contexts/AdminContext'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'
import { useLocation } from '@/contexts/LocationContext'
import { useAuth } from '@/contexts/AuthContext'
import AdminLoginModal from '@/components/ui/AdminLoginModal'
import Cart from '@/components/ui/Cart'
import SearchBar from '@/components/ui/SearchBar'
import LocationModal from '@/components/ui/LocationModal'
import { 
  Shield, 
  LogOut,
  ShoppingBag,
  MapPin,
  ChevronDown,
  MoreHorizontal,
  Building2,
  Users,
  Bike,
  Phone,
  Smartphone,
  HelpCircle,
  User,
  Settings,
  Heart,
  MapPin as MapPinIcon,
  CreditCard,
  Gift
} from 'lucide-react'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const { isAdmin, logout } = useAdmin()
  const { toggleCart, getCartItemCount } = useCart()
  const { location, hasLocation } = useLocation()
  const { user, isAuthenticated, logout: authLogout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setScrolled(window.scrollY > 20)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close More dropdown if clicking outside
      if (showMoreDropdown && !target.closest('[data-dropdown="more"]')) {
        setShowMoreDropdown(false)
      }
      
      // Close User dropdown if clicking outside
      if (showUserDropdown && !target.closest('[data-dropdown="user"]')) {
        setShowUserDropdown(false)
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreDropdown, showUserDropdown])

  const navItems = [
    { name: 'About', href: '/about' },
    { name: 'Partners', href: '/restaurants' },
    { name: 'Riders', href: '/riders' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center space-x-3 cursor-pointer"
              >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <span className="text-white font-black text-2xl">F</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  FoodNow
                </h1>
                <p className="text-[10px] text-gray-600 -mt-1 tracking-wider">PREMIUM DELIVERY</p>
              </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center flex-1 max-w-4xl mx-8">
              <nav className="flex items-center space-x-8">
                {/* Location Selector */}
                <motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <div className="text-left">
                    {hasLocation ? (
                      <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {location?.address?.split(',')[0] || location?.city || 'Location set'}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        Set Location
                      </div>
                    )}
                    <div className="text-xs text-gray-600 -mt-0.5">
                      {hasLocation ? 'Change location' : 'Choose your area'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </motion.button>

                {/* More Dropdown for Navigation Items */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="relative"
                  data-dropdown="more"
                >
                  <button
                    onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 font-medium transition-all duration-300 group whitespace-nowrap px-3 py-2 rounded-xl hover:bg-gray-100"
                  >
                    <span>More</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showMoreDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showMoreDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50"
                      >
                        <div className="p-2">
                          {navItems.map((item, index) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setShowMoreDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group"
                            >
                              {item.name === 'About' && <HelpCircle className="w-4 h-4" />}
                              {item.name === 'Partners' && <Building2 className="w-4 h-4" />}
                              {item.name === 'Riders' && <Bike className="w-4 h-4" />}
                              {item.name === 'Contact' && <Phone className="w-4 h-4" />}
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </nav>
              
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex-1 max-w-md mx-8"
              >
                <SearchBar 
                  placeholder="Search restaurants, dishes..."
                  className="w-full"
                />
              </motion.div>
              
              {/* Admin Access - Hidden for Security */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="flex items-center space-x-3"
                >
                  <Link
                    href="/admin-system"
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Portal</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 px-2 py-2 rounded-xl font-medium transition-colors"
                    title="Logout from admin"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Desktop CTA & Cart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="hidden lg:flex items-center space-x-4"
            >
              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 group"
              >
                <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
              
              {/* Authentication System */}
              {!isAuthenticated ? (
                // Guest User - Sign In/Sign Up buttons
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors duration-300 rounded-xl hover:bg-gray-100"
                    >
                      Sign In
                    </motion.button>
                  </Link>
                  <Link href="/auth/signup">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative group bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30"
                    >
                      <span className="relative z-10">Sign Up</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>
                  </Link>
                </div>
              ) : (
                // Authenticated User - Avatar with dropdown
                <div className="relative" data-dropdown="user">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        {user?.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={`${user.first_name || 'User'} avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.first_name || 'User'}
                      </div>
                      <div className="text-xs text-gray-600 -mt-0.5">
                        {user?.tier || 'Bronze'} Member
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50"
                      >
                        <div className="p-3">
                          {/* User Info Header */}
                          <div className="px-3 py-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                {user?.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt={`${user.first_name || 'User'} avatar`}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {user?.first_name} {user?.last_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {user?.email}
                                </div>
                                <div className="text-xs text-orange-600 font-medium">
                                  {user?.tier || 'Bronze'} • {user?.loyalty_points || 0} points
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link
                              href="/dashboard"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <Settings className="w-4 h-4" />
                              <span className="font-medium">Dashboard</span>
                            </Link>
                            <Link
                              href="/profile"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <User className="w-4 h-4" />
                              <span className="font-medium">Profile</span>
                            </Link>
                            <Link
                              href="/orders"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span className="font-medium">My Orders</span>
                            </Link>
                            <Link
                              href="/profile?tab=favorites"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <Heart className="w-4 h-4" />
                              <span className="font-medium">Favorites</span>
                            </Link>
                            <Link
                              href="/profile?tab=addresses"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <MapPinIcon className="w-4 h-4" />
                              <span className="font-medium">Addresses</span>
                            </Link>
                            <Link
                              href="/profile?tab=payment"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span className="font-medium">Payment Methods</span>
                            </Link>
                            <Link
                              href="/profile?tab=rewards"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                            >
                              <Gift className="w-4 h-4" />
                              <span className="font-medium">Rewards</span>
                            </Link>
                          </div>

                          {/* Logout */}
                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setShowUserDropdown(false)
                                authLogout()
                              }}
                              className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 w-full"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="font-medium">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden relative w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute w-6 h-0.5 bg-gray-700 transform transition-all duration-300 ${isOpen ? 'rotate-45 top-3' : 'top-1'}`}></span>
                <span className={`absolute w-6 h-0.5 bg-gray-700 top-3 transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute w-6 h-0.5 bg-gray-700 transform transition-all duration-300 ${isOpen ? '-rotate-45 top-3' : 'top-5'}`}></span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl z-40 shadow-2xl lg:hidden"
          >
            <div className="p-6 pt-24">
              <nav className="space-y-6">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block text-gray-700 hover:text-orange-600 font-semibold text-lg transition-colors duration-300"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Mobile Admin Access - Hidden for Security */}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 pt-4 border-t border-gray-200"
                  >
                    <Link
                      href="/admin-system"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors duration-300"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin Portal</span>
                    </Link>
                    <button
                      onClick={() => {
                        authLogout()
                        setIsOpen(false)
                      }}
                      className="flex items-center space-x-3 text-red-600 hover:text-red-700 font-medium transition-colors duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout Admin</span>
                    </button>
                  </motion.div>
                )}
              </nav>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 space-y-4"
              >
                <button
                  onClick={() => {
                    toggleCart()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-center space-x-2 border-2 border-orange-500 text-orange-600 font-bold py-4 px-8 rounded-full transition-all duration-300 hover:bg-orange-500 hover:text-white"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Cart ({getCartItemCount()})</span>
                </button>
                
                {/* Mobile Authentication */}
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <Link href="/auth/login">
                      <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full border-2 border-orange-500 text-orange-600 font-bold py-4 px-8 rounded-full transition-all duration-300 hover:bg-orange-500 hover:text-white"
                      >
                        Sign In
                      </button>
                    </Link>
                    <Link href="/auth/signup">
                      <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg"
                      >
                        Sign Up
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* User Profile Section */}
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        {user?.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={`${user.first_name || 'User'} avatar`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user?.tier || 'Bronze'} • {user?.loyalty_points || 0} points
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/orders">
                        <button 
                          onClick={() => setIsOpen(false)}
                          className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-xl transition-colors hover:bg-orange-100"
                        >
                          <ShoppingBag className="w-6 h-6 mb-1" />
                          <span className="text-sm font-medium">Orders</span>
                        </button>
                      </Link>
                      <Link href="/profile">
                        <button 
                          onClick={() => setIsOpen(false)}
                          className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-xl transition-colors hover:bg-orange-100"
                        >
                          <User className="w-6 h-6 mb-1" />
                          <span className="text-sm font-medium">Profile</span>
                        </button>
                      </Link>
                    </div>

                    <button
                      onClick={() => {
                        authLogout()
                        setIsOpen(false)
                      }}
                      className="w-full flex items-center justify-center space-x-2 border-2 border-red-300 text-red-600 font-medium py-3 px-8 rounded-full transition-all duration-300 hover:border-red-500 hover:bg-red-50"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
                
                <Link href={hasLocation ? "/explore" : "#"}>
                  <button 
                    onClick={() => {
                      if (!hasLocation) {
                        setIsOpen(false)
                        setShowLocationModal(true)
                      } else {
                        setIsOpen(false)
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg"
                  >
                    Explore Restaurants
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          // Optionally redirect to admin dashboard after login
          // window.location.href = '/admin'
        }}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Cart Component */}
      <Cart />
    </>
  )
}

export default Navigation