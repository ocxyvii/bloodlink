'use client'

import { useState } from 'react'
import { Bug } from 'lucide-react'
import { cleanupAnomalousRequestData, fixAdminCenterAssignments, validateRequestData } from '@/app/actions/data-cleanup'
import { debugReportsData } from '@/app/actions/reports-debug'
import { toast } from 'sonner'

export function CleanupButtons() {
  const [isCleaning, setIsCleaning] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)

  const handleCleanup = async () => {
    setIsCleaning(true)
    try {
      const result = await cleanupAnomalousRequestData()
      if (result.error) {
        toast.error(`Cleanup Error: ${result.error}`)
      } else {
        toast.success(`Cleanup Success: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Unexpected error: ${(error as Error).message}`)
    } finally {
      setIsCleaning(false)
    }
  }

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const result = await validateRequestData()
      if (result.error) {
        toast.error(`Validation Error: ${result.error}`)
      } else {
        toast.success(`Validation Success: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Unexpected error: ${(error as Error).message}`)
    } finally {
      setIsValidating(false)
    }
  }

  const handleFixAssignments = async () => {
    setIsFixing(true)
    try {
      const result = await fixAdminCenterAssignments()
      if (result.error) {
        toast.error(`Assignment Error: ${result.error}`)
      } else {
        toast.success(`Assignment Success: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Unexpected error: ${(error as Error).message}`)
    } finally {
      setIsFixing(false)
    }
  }

  const handleDebug = async () => {
    setIsDebugging(true)
    try {
      const result = await debugReportsData()
      if (result.error) {
        toast.error(`Debug Error: ${result.error}`)
      } else {
        console.log('Debug Results:', result)
        toast.success(`Debug Complete - Check console for details`)
      }
    } catch (error) {
      toast.error(`Unexpected error: ${(error as Error).message}`)
    } finally {
      setIsDebugging(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCleanup}
        disabled={isCleaning}
        className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Bug size={14} />
        {isCleaning ? 'Cleaning...' : 'Clean Data'}
      </button>
      <button
        onClick={handleValidate}
        disabled={isValidating}
        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Bug size={14} />
        {isValidating ? 'Validating...' : 'Validate Data'}
      </button>
      <button
        onClick={handleFixAssignments}
        disabled={isFixing}
        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Bug size={14} />
        {isFixing ? 'Fixing...' : 'Fix Assignments'}
      </button>
      <button
        onClick={handleDebug}
        disabled={isDebugging}
        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Bug size={14} />
        {isDebugging ? 'Debugging...' : 'Debug Reports'}
      </button>
    </div>
  )
}
