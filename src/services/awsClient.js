// ============================================================================
// TURNING POINT RETAIL SOLUTIONS - AWS API CLIENT SERVICE
// File: src/services/awsClient.js
// ============================================================================

const DEPLOYED_AWS_API = 'https://vb8j474fn3.execute-api.us-east-1.amazonaws.com';
const AWS_API_ENDPOINT = import.meta.env?.VITE_AWS_API_ENDPOINT || localStorage.getItem('tp_aws_api_endpoint') || DEPLOYED_AWS_API;

export const isAwsConfigured = Boolean(AWS_API_ENDPOINT);

// 1. Petty Cash AWS Lambda API
export async function fetchAwsPettyCash(monthTag) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/petty-cash?monthTag=${encodeURIComponent(monthTag || 'PETTY_CASH_AUG')}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('AWS Petty Cash fetch error:', err);
    return null;
  }
}

export async function saveAwsPettyCashTransaction(transactionPayload) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/petty-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'savePettyCash', item: transactionPayload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.item || null;
  } catch (err) {
    console.warn('AWS Petty Cash save error:', err);
    return null;
  }
}

export async function deleteAwsPettyCashTransaction(itemId, monthTag) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/petty-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deletePettyCash', itemId, monthTag })
    });
    return res.ok;
  } catch (err) {
    console.warn('AWS Petty Cash delete error:', err);
    return false;
  }
}

// 2. Projects AWS Lambda API
export async function fetchAwsProjects() {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/projects`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('AWS Projects fetch error:', err);
    return null;
  }
}

export async function saveAwsProject(projectPayload) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveProject', project: projectPayload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.project || null;
  } catch (err) {
    console.warn('AWS Project save error:', err);
    return null;
  }
}

// 3. Friday Reports AWS Lambda API
export async function fetchAwsFridayReports() {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/friday-reports`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('AWS Friday Reports fetch error:', err);
    return null;
  }
}

export async function saveAwsFridayReport(reportPayload) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/friday-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveFridayReport', report: reportPayload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.report || null;
  } catch (err) {
    console.warn('AWS Friday Report save error:', err);
    return null;
  }
}

// 4. PnL AWS Lambda API
export async function fetchAwsPnL() {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/pnl`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('AWS PnL fetch error:', err);
    return null;
  }
}

export async function saveAwsPnL(pnlPayload) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/pnl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'savePnL', pnl: pnlPayload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.pnl || null;
  } catch (err) {
    console.warn('AWS PnL save error:', err);
    return null;
  }
}

// 5. Chat AWS Lambda API
export async function fetchAwsChatMessages() {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/chat`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('AWS Chat fetch error:', err);
    return null;
  }
}

export async function sendAwsChatMessage(messagePayload) {
  if (!AWS_API_ENDPOINT) return null;
  try {
    const res = await fetch(`${AWS_API_ENDPOINT}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendChat', message: messagePayload })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.messageItem || null;
  } catch (err) {
    console.warn('AWS Chat send error:', err);
    return null;
  }
}
