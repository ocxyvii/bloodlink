'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DebugInfoProps {
  data: {
    isSuperAdmin?: boolean
    userRole?: string
    centers: any[]
    userCenter?: any
  }
}

export function DebugInfo({ data }: DebugInfoProps) {
  return (
    <Card className="mb-4 border-2 border-red-300">
      <CardHeader>
        <CardTitle className="text-sm">Debug Info (Remove in production)</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div><strong>isSuperAdmin:</strong> {String(data.isSuperAdmin)}</div>
        <div><strong>userRole:</strong> {data.userRole}</div>
        <div><strong>centers count:</strong> {data.centers.length}</div>
        <div><strong>userCenter:</strong> {data.userCenter ? data.userCenter.name : 'None'}</div>
        <div><strong>Centers:</strong></div>
        <ul className="ml-4">
          {data.centers.slice(0, 3).map((center, i) => (
            <li key={i}>{center.name} - {center.city} (ID: {center.id})</li>
          ))}
          {data.centers.length > 3 && <li>... and {data.centers.length - 3} more</li>}
        </ul>
      </CardContent>
    </Card>
  )
}
