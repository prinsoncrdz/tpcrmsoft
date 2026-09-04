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
    return data;
  } catch (err) {
    console.warn('Supabase projects fetch error:', err);
    return null;
  }
}

export async function saveSupabaseProject(projectPayload) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('projects')
      .upsert(projectPayload, { onConflict: 'project_id' })
      .select();

    if (error) throw error;
    return data;
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
