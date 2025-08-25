'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/contexts/AdminContext'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'
import AdminLoginModal from '@/components/ui/AdminLoginModal'
import Cart from '@/components/ui/Cart'
import SearchBar from '@/components/ui/SearchBar'
import { 
  Shield, 
  LogOut,
  ShoppingBag
} from 'lucide-react'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const { isAdmin, logout } = useAdmin()
  const { toggleCart, getCartItemCount } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Explore', href: '/explore' },
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
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  >
                    <Link
                      href={item.href}
                      className="relative text-gray-700 hover:text-orange-600 font-medium transition-all duration-300 group whitespace-nowrap"
                    >
                      {item.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
                    </Link>
                  </motion.div>
                ))}
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
                    href="/admin-portal-7k9x2m"
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
              
              {/* Order Now Button */}
              <Link href="/browse">
                <button className="relative group bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40">
                  <span className="relative z-10">Order Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
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
                      href="/admin-portal-7k9x2m"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors duration-300"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin Portal</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout()
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
                <Link href="/browse">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg"
                  >
                    Order Now
                  </button>
                </Link>
                <button className="w-full border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-full transition-all duration-300 hover:border-orange-500 hover:text-orange-600">
                  Download App
                </button>
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

      {/* Cart Component */}
      <Cart />
    </>
  )
}

export default Navigation