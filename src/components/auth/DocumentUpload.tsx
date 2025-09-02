'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'

interface DocumentRequirement {
  id: string
  title: string
  description: string
  acceptedTypes: string[]
  maxSize: number // in MB
  required: boolean
  examples?: string[]
}

interface UploadedDocument {
  id: string
  file: File
  url?: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  error?: string
  preview?: string
}

interface DocumentUploadProps {
  documentRequirements: DocumentRequirement[]
  onDocumentsChange: (documents: { [key: string]: UploadedDocument }) => void
  userRole: 'restaurant_owner' | 'rider'
}

export default function DocumentUpload({ 
  documentRequirements, 
  onDocumentsChange,
  userRole 
}: DocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: UploadedDocument }>({})
  const [dragOver, setDragOver] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleFileSelect = useCallback(async (requirementId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const requirement = documentRequirements.find(req => req.id === requirementId)
    
    if (!requirement) return

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const acceptedExtensions = requirement.acceptedTypes.map(type => type.split('/')[1] || type)
    
    if (!acceptedExtensions.includes(fileExtension || '')) {
      setUploadedDocuments(prev => ({
        ...prev,
        [requirementId]: {
          id: requirementId,
          file,
          status: 'error',
          error: `File type not supported. Accepted types: ${requirement.acceptedTypes.join(', ')}`
        }
      }))
      return
    }

    // Validate file size
    if (file.size > requirement.maxSize * 1024 * 1024) {
      setUploadedDocuments(prev => ({
        ...prev,
        [requirementId]: {
          id: requirementId,
          file,
          status: 'error',
          error: `File size exceeds ${requirement.maxSize}MB limit`
        }
      }))
      return
    }

    // Create preview for images
    let preview: string | undefined
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    // Set initial upload state
    const document: UploadedDocument = {
      id: requirementId,
      file,
      status: 'uploading',
      preview
    }

    setUploadedDocuments(prev => {
      const updated = { ...prev, [requirementId]: document }
      onDocumentsChange(updated)
      return updated
    })

    try {
      // Upload to Supabase storage
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `documents/${userRole}/${requirementId}/${fileName}`

      devLog.info('Starting document upload', {
        requirementId,
        fileName,
        fileSize: file.size,
        fileType: file.type
      })

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath)

      const updatedDocument: UploadedDocument = {
        ...document,
        status: 'uploaded',
        url: urlData.publicUrl
      }

      setUploadedDocuments(prev => {
        const updated = { ...prev, [requirementId]: updatedDocument }
        onDocumentsChange(updated)
        return updated
      })

      prodLog.info('Document uploaded successfully', {
        requirementId,
        fileName,
        filePath,
        publicUrl: urlData.publicUrl
      })

    } catch (error) {
      prodLog.error('Document upload failed', error, {
        requirementId,
        fileName: file.name
      })

      const errorDocument: UploadedDocument = {
        ...document,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }

      setUploadedDocuments(prev => {
        const updated = { ...prev, [requirementId]: errorDocument }
        onDocumentsChange(updated)
        return updated
      })
    }
  }, [documentRequirements, onDocumentsChange, userRole])

  const handleDrop = useCallback((requirementId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    handleFileSelect(requirementId, e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((requirementId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(requirementId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(null)
  }, [])

  const removeDocument = useCallback((requirementId: string) => {
    const document = uploadedDocuments[requirementId]
    if (document?.preview) {
      URL.revokeObjectURL(document.preview)
    }

    setUploadedDocuments(prev => {
      const updated = { ...prev }
      delete updated[requirementId]
      onDocumentsChange(updated)
      return updated
    })

    // Clear file input
    if (fileInputRefs.current[requirementId]) {
      fileInputRefs.current[requirementId]!.value = ''
    }
  }, [uploadedDocuments, onDocumentsChange])

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600" />
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Upload className="w-5 h-5 text-gray-400" />
    }
  }

  const openPreview = (document: UploadedDocument) => {
    if (document.url) {
      window.open(document.url, '_blank')
    } else if (document.preview) {
      window.open(document.preview, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Required Documents
        </h3>
        <p className="text-gray-600">
          Upload the following documents to verify your {userRole.replace('_', ' ')} account.
        </p>
      </div>

      {documentRequirements.map((requirement) => {
        const uploadedDoc = uploadedDocuments[requirement.id]
        
        return (
          <div key={requirement.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    {requirement.title}
                  </h4>
                  {requirement.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {requirement.description}
                </p>
                <div className="text-xs text-gray-500">
                  Accepted: {requirement.acceptedTypes.join(', ')} • Max size: {requirement.maxSize}MB
                </div>
              </div>
            </div>

            {uploadedDoc ? (
              <div className="space-y-3">
                {/* Uploaded Document Display */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(uploadedDoc.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedDoc.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedDoc.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      {uploadedDoc.status === 'error' && uploadedDoc.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {uploadedDoc.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(uploadedDoc.url || uploadedDoc.preview) && (
                      <button
                        onClick={() => openPreview(uploadedDoc)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeDocument(requirement.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove document"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                {uploadedDoc.preview && (
                  <div className="mt-2">
                    <img
                      src={uploadedDoc.preview}
                      alt="Document preview"
                      className="max-w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === requirement.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={(e) => handleDrop(requirement.id, e)}
                onDragOver={(e) => handleDragOver(requirement.id, e)}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={(ref) => { fileInputRefs.current[requirement.id] = ref }}
                  type="file"
                  accept={requirement.acceptedTypes.join(',')}
                  onChange={(e) => handleFileSelect(requirement.id, e.target.files)}
                  className="hidden"
                  id={`file-input-${requirement.id}`}
                />
                
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <label
                    htmlFor={`file-input-${requirement.id}`}
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Choose File
                  </label>
                  <p className="text-sm text-gray-600">
                    or drag and drop here
                  </p>
                </div>
              </div>
            )}

            {requirement.examples && requirement.examples.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Examples:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {requirement.examples.map((example, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              Document Guidelines
            </h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Documents must be clear and readable</li>
              <li>• All information should be visible and not cropped</li>
              <li>• Files should be in good quality (not blurry or dark)</li>
              <li>• Personal information will be kept secure and confidential</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}