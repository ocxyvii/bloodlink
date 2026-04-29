'use client'

import { ProfessionalReports } from '@/components/reports/professional-reports'

interface ReportsClientProps {
  requests: any[]
  donations: any[]
  inventory: any[]
  centers: any[]
  userCenter?: any
  userRole?: string
  isSuperAdmin?: boolean
}

export function ReportsClient({ requests, donations, inventory, centers, userCenter, userRole, isSuperAdmin }: ReportsClientProps) {
  const data = { requests, donations, inventory, centers, userCenter, userRole, isSuperAdmin }

  return (
    <ProfessionalReports data={data} />
  )
}
