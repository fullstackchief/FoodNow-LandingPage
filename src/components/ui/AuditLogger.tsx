'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const AuditLogger = () => {
  const { auditLogs, hasPermission } = useEnhancedAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState('all')
  const [selectedAction, setSelectedAction] = useState('all')
  const [dateRange, setDateRange] = useState('all') // today, week, month, all
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Get unique admins and actions for filters
  const uniqueAdmins = useMemo(() => {
    const admins = [...new Set(auditLogs.map(log => log.adminEmail))]
    return admins.sort()
  }, [auditLogs])

  const uniqueActions = useMemo(() => {
    const actions = [...new Set(auditLogs.map(log => log.action))]
    return actions.sort()
  }, [auditLogs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Admin filter
    if (selectedAdmin !== 'all') {
      filtered = filtered.filter(log => log.adminEmail === selectedAdmin)
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate)
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [auditLogs, searchTerm, selectedAdmin, selectedAction, dateRange])

  if (!hasPermission('settings', 'view')) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to view audit logs.</p>
        </div>
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('login')) return '🔑'
    if (actionLower.includes('logout')) return '🚪'
    if (actionLower.includes('create')) return '➕'
    if (actionLower.includes('delete')) return '🗑️'
    if (actionLower.includes('edit') || actionLower.includes('update')) return '✏️'
    if (actionLower.includes('approve')) return '✅'
    if (actionLower.includes('reject')) return '❌'
    if (actionLower.includes('view')) return '👁️'
    if (actionLower.includes('password')) return '🔒'
    if (actionLower.includes('invite')) return '📧'
    return '📝'
  }

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('login') || actionLower.includes('create')) return 'text-green-600 bg-green-50'
    if (actionLower.includes('logout')) return 'text-blue-600 bg-blue-50'
    if (actionLower.includes('delete') || actionLower.includes('reject')) return 'text-red-600 bg-red-50'
    if (actionLower.includes('edit') || actionLower.includes('update')) return 'text-yellow-600 bg-yellow-50'
    if (actionLower.includes('approve')) return 'text-green-600 bg-green-50'
    if (actionLower.includes('password')) return 'text-purple-600 bg-purple-50'
    return 'text-gray-600 bg-gray-50'
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Admin', 'Action', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.adminEmail,
        log.action,
        `"${log.details.replace(/"/g, '""')}"`,
        log.ipAddress || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-black mb-2">Audit Logs</h1>
              <p className="text-indigo-100 text-lg">
                Monitor admin activities and system events
              </p>
            </div>
          </div>
          <button
            onClick={exportLogs}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueAdmins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Action Types</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueActions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => {
                  const today = new Date()
                  const logDate = new Date(log.timestamp)
                  return logDate.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Admin Filter */}
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Admins</option>
            {uniqueAdmins.map(admin => (
              <option key={admin} value={admin}>{admin}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Showing {filteredLogs.length} of {auditLogs.length} log entries</span>
          {(searchTerm || selectedAdmin !== 'all' || selectedAction !== 'all' || dateRange !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedAdmin('all')
                setSelectedAction('all')
                setDateRange('all')
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
                <p className="text-gray-600">Try adjusting your search filters.</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getActionIcon(log.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-600">{log.adminEmail}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-1">{log.details}</p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-500 mt-1">IP: {log.ipAddress}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            {(() => {
              const log = filteredLogs.find(l => l.id === showDetails)
              if (!log) return null

              return (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Log Details</h2>
                      <button
                        onClick={() => setShowDetails(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Action</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{log.details}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Admin User</h3>
                      <p className="text-gray-700">{log.adminEmail}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Timestamp</h3>
                      <p className="text-gray-700">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    {log.ipAddress && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">IP Address</h3>
                        <p className="text-gray-700 font-mono">{log.ipAddress}</p>
                      </div>
                    )}
                    {log.userAgent && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">User Agent</h3>
                        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg break-all">
                          {log.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AuditLogger