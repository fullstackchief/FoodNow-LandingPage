'use client'

import EnhancedAdminRoute from '@/components/ui/EnhancedAdminRoute'
import EnhancedAdminDashboard from '@/components/ui/EnhancedAdminDashboard'

const AdminPortalPage = () => {
  return (
    <EnhancedAdminRoute>
      <EnhancedAdminDashboard />
    </EnhancedAdminRoute>
  )
}

export default AdminPortalPage