'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminContextType {
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
  showAdminPanel: boolean
  toggleAdminPanel: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Simple demo password - in production, this would be proper authentication
const ADMIN_PASSWORD = 'foodnow-admin-2024'

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    // Check if admin is already logged in (localStorage)
    const adminStatus = localStorage.getItem('foodnow-admin-logged-in')
    if (adminStatus === 'true') {
      setIsAdmin(true)
    }
  }, [])

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      localStorage.setItem('foodnow-admin-logged-in', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAdmin(false)
    setShowAdminPanel(false)
    localStorage.removeItem('foodnow-admin-logged-in')
  }

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel)
  }

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        login,
        logout,
        showAdminPanel,
        toggleAdminPanel,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}