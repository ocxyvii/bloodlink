'use client'

import { useState } from 'react'
import {
  ScrollText, Search, RefreshCw,
  Shield, User, Droplets, Building2,
  ClipboardList, Heart, Settings, Eye
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow, format } from 'date-fns'

interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  actor?: {
    full_name: string
    email: string
    role: string
  } | null
}

const actionConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  CREATE_ADMIN:       { color: 'bg-green-100 text-green-700 border-green-200',   icon: <User size={11} /> },
  UPDATE_ADMIN:       { color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <User size={11} /> },
  DELETE_ADMIN:       { color: 'bg-red-100 text-red-700 border-red-200',         icon: <User size={11} /> },
  ACTIVATE_ADMIN:     { color: 'bg-green-100 text-green-700 border-green-200',   icon: <Shield size={11} /> },
  DEACTIVATE_ADMIN:   { color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: <Shield size={11} /> },
  CREATE_CENTER:      { color: 'bg-purple-100 text-purple-700 border-purple-200',icon: <Building2 size={11} /> },
  UPDATE_CENTER:      { color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <Building2 size={11} /> },
  DELETE_CENTER:      { color: 'bg-red-100 text-red-700 border-red-200',         icon: <Building2 size={11} /> },
  ACTIVATE_CENTER:    { color: 'bg-green-100 text-green-700 border-green-200',   icon: <Building2 size={11} /> },
  DEACTIVATE_CENTER:  { color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: <Building2 size={11} /> },
  ADD_INVENTORY:      { color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <Droplets size={11} /> },
  UPDATE_INVENTORY:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-200',icon: <Droplets size={11} /> },
  REQUEST_APPROVED:   { color: 'bg-green-100 text-green-700 border-green-200',   icon: <ClipboardList size={11} /> },
  REQUEST_REJECTED:   { color: 'bg-red-100 text-red-700 border-red-200',         icon: <ClipboardList size={11} /> },
  REQUEST_FULFILLED:  { color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <ClipboardList size={11} /> },
  DONATION_COMPLETED: { color: 'bg-green-100 text-green-700 border-green-200',   icon: <Heart size={11} /> },
  DONATION_CANCELLED: { color: 'bg-red-100 text-red-700 border-red-200',         icon: <Heart size={11} /> },
}

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] ?? {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <Settings size={11} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${config.color}`}>
      {config.icon}
      {action.replace(/_/g, ' ')}
    </span>
  )
}

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch]           = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterTable, setFilterTable]   = useState('all')
  const [selected, setSelected]         = useState<AuditLog | null>(null)

  const actions = Array.from(new Set(logs.map(l => l.action))).sort()
  const tables  = Array.from(new Set(logs.map(l => l.table_name))).sort()

  const filtered = logs.filter(l => {
    const matchSearch =
      (l.actor?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.actor?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.table_name.toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === 'all' || l.action === filterAction
    const matchTable  = filterTable  === 'all' || l.table_name === filterTable
    return matchSearch && matchAction && matchTable
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText size={24} className="text-primary" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          {logs.length} entries · Full system activity trail
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',   value: logs.length,                                              color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Admin Actions',  value: logs.filter(l => l.action.includes('ADMIN')).length,      color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Request Events', value: logs.filter(l => l.action.includes('REQUEST')).length,    color: 'bg-orange-50 text-orange-700 border-orange-100' },
          { label: 'Today',          value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'bg-green-50 text-green-700 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search actor, action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(a => (
              <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tables.map(t => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterAction !== 'all' || filterTable !== 'all') && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterAction('all'); setFilterTable('all') }}
            className="h-9 text-muted-foreground gap-1"
          >
            <RefreshCw size={13} /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {logs.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">Actor</TableHead>
              <TableHead className="font-semibold">Table</TableHead>
              <TableHead className="font-semibold">Record ID</TableHead>
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <ScrollText size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No audit logs found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(log => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    {log.actor ? (
                      <div>
                        <p className="text-sm font-medium">{log.actor.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{log.actor.role.replace('_', ' ')}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {log.table_name.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.record_id ? log.record_id.slice(0, 8) + '...' : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-medium">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(log.new_data || log.old_data) && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setSelected(log)}
                      >
                        <Eye size={13} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText size={16} />
              Audit Detail
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <span className="text-sm text-muted-foreground">Action</span>
                <ActionBadge action={selected.action} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <span className="text-sm text-muted-foreground">Actor</span>
                <span className="text-sm font-medium">{selected.actor?.full_name ?? 'System'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium">
                  {format(new Date(selected.created_at), 'dd MMM yyyy HH:mm:ss')}
                </span>
              </div>
              {selected.new_data && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">New Data</p>
                  <pre className="text-xs bg-muted p-3 rounded-xl overflow-x-auto">
                    {JSON.stringify(selected.new_data, null, 2)}
                  </pre>
                </div>
              )}
              {selected.old_data && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Old Data</p>
                  <pre className="text-xs bg-muted p-3 rounded-xl overflow-x-auto">
                    {JSON.stringify(selected.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}