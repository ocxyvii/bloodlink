import { createClient } from '@/lib/supabase/server'
import { AuditClient } from './audit-client'

export default async function AuditPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles(full_name, email, role)')
    .order('created_at', { ascending: false })
    .limit(200)

  return <AuditClient logs={logs ?? []} />
}