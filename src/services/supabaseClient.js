import { createClient } from '@supabase/supabase-js';

// User provided Supabase publishable key
const DEFAULT_SUPABASE_KEY = 'sb_publishable_MpfhCDs9Kp54qLVPJ4HD0A_P3eTT-Zq';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || localStorage.getItem('tp_supabase_url') || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('tp_supabase_anon_key') || DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      }
    })
  : null;

// Real-Time Table Change Listener for sub-50ms instant updates across PCs
export function subscribeToRealtimeTable(tableName, onPayload) {
  if (!supabase || !tableName) return null;

  const channel = supabase
    .channel(`realtime-${tableName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      if (onPayload && typeof onPayload === 'function') {
        onPayload(payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Project Mapper Functions (relational PostgreSQL <-> camelCase React UI)
export function mapProjectToSupabase(p) {
  if (!p) return null;
  return {
    project_id: p.projectId || p.id || `PROJ-${Date.now()}`,
    company_name: p.companyName || p.projectName || 'New Project',
    client_name: p.client || p.clientName || '',
    sector: p.sector || '',
    project_owner: p.owner || p.projectOwner || '',
    assigned_to: p.assignedTo || p.assignee || '',
    contract_value: parseFloat((p.value || p.contractValue || '0').toString().replace('$', '').replace(/,/g, '')) || 0,
    deposit_paid: parseFloat((p.depositPaid || '0').toString().replace('$', '').replace(/,/g, '')) || 0,
    start_date: p.startDate && p.startDate !== '-' ? p.startDate : null,
    completion_pct: parseInt((p.completion || p.completionPct || '0').toString().replace('%', ''), 10) || 0,
    status: p.status || 'Pending CEO Approval',
    priority: p.priority || 'High',
    status_update: p.statusUpdate || '',
    drive_link: p.driveLink || '',
    next_action: p.nextAction || '',
    next_action_due: p.nextActionDueDate && p.nextActionDueDate !== '-' ? p.nextActionDueDate : null,
    financials: p.financials || {},
    is_deleted: Boolean(p.isDeleted || p.status === 'DELETED')
  };
}

export function mapSupabaseToProject(row) {
  if (!row) return null;
  return {
    id: row.project_id || row.id,
    projectId: row.project_id,
    companyName: row.company_name,
    projectName: row.company_name,
    client: row.client_name,
    clientName: row.client_name,
    sector: row.sector,
    owner: row.project_owner,
    projectOwner: row.project_owner,
    assignedTo: row.assigned_to,
    assignee: row.assigned_to,
    value: `$${(row.contract_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    contractValueUsd: row.contract_value || 0,
    depositPaid: `$${(row.deposit_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    startDate: row.start_date || '-',
    completion: `${row.completion_pct || 0}%`,
    completionPct: row.completion_pct || 0,
    status: row.status || 'Pending CEO Approval',
    priority: row.priority || 'High',
    statusUpdate: row.status_update || '',
    driveLink: row.drive_link || '',
    nextAction: row.next_action || '',
    nextActionDueDate: row.next_action_due || '-',
    financials: row.financials || {},
    isDeleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// 1. Projects Data Layer
export async function fetchSupabaseProjects() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseToProject);
  } catch (err) {
    console.warn('Supabase projects fetch error:', err);
    return null;
  }
}

export async function saveSupabaseProject(projectPayload) {
  if (!supabase) return null;
  try {
    const dbRecord = mapProjectToSupabase(projectPayload);
    const { data, error } = await supabase
      .from('projects')
      .upsert(dbRecord, { onConflict: 'project_id' })
      .select();

    if (error) throw error;
    return (data || []).map(mapSupabaseToProject);
  } catch (err) {
    console.warn('Supabase project save error:', err);
    return null;
  }
}

// 2. Petty Cash Data Layer
export async function fetchSupabasePettyCash(monthTag) {
  if (!supabase) return null;
  try {
    let query = supabase.from('petty_cash_transactions').select('*').eq('is_deleted', false);
    if (monthTag) query = query.eq('month_tag', monthTag);
    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase petty cash fetch error:', err);
    return null;
  }
}

export async function saveSupabasePettyCashTransaction(transactionPayload) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('petty_cash_transactions')
      .upsert(transactionPayload)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase petty cash save error:', err);
    return null;
  }
}

// 3. Friday Executive Reports Data Layer
export async function fetchSupabaseFridayReports() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('friday_reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase friday reports fetch error:', err);
    return null;
  }
}

export async function saveSupabaseFridayReport(reportPayload) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('friday_reports')
      .upsert(reportPayload)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase friday report save error:', err);
    return null;
  }
}

// 4. CEO PnL Tracker Data Layer
export async function fetchSupabasePnL() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pnl_tracker')
      .select('*');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase PnL fetch error:', err);
    return null;
  }
}

export async function saveSupabasePnL(pnlPayload) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pnl_tracker')
      .upsert(pnlPayload, { onConflict: 'month' })
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase PnL save error:', err);
    return null;
  }
}

// 5. Team Real-Time Chat Data Layer
export async function fetchSupabaseChatMessages() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase chat messages fetch error:', err);
    return null;
  }
}

export async function sendSupabaseChatMessage(messagePayload) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .insert(messagePayload)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase chat message send error:', err);
    return null;
  }
}
