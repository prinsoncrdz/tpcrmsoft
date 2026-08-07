import { sendGlobalNotification, fetchGlobalNotifications } from './googleSheets';

const NOTIFICATIONS_STORAGE_KEY = 'tp_crm_notifications_v1';

export function getNotifications(userEmail) {
  if (!userEmail) return [];
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const allNotifs = JSON.parse(saved);
    return allNotifs.filter(n => n.recipientEmail.toLowerCase() === userEmail.toLowerCase());
  } catch (err) {
    return [];
  }
}

// Background sync from Cloud Endpoint
export async function syncGlobalNotifications(userEmail) {
  if (!userEmail) return [];
  const cloudNotifs = await fetchGlobalNotifications();
  if (Array.isArray(cloudNotifs)) {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    let localNotifs = [];
    if (saved) {
      try { localNotifs = JSON.parse(saved); } catch (err) { localNotifs = []; }
    }

    // Merge Cloud and Local using Map by ID
    const notifMap = new Map();
    localNotifs.forEach(n => notifMap.set(n.id, n));
    cloudNotifs.forEach(n => {
      if (!notifMap.has(n.id)) {
        notifMap.set(n.id, n);
      }
    });

    const merged = Array.from(notifMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('tp_notification_updated'));
    return merged.filter(n => n.recipientEmail.toLowerCase() === userEmail.toLowerCase());
  }
  return getNotifications(userEmail);
}

export function createNotification({ recipientEmail, title, message, projectId, subTaskId, type = 'ASSIGNMENT', createdByName }) {
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  let allNotifs = [];
  if (saved) {
    try { allNotifs = JSON.parse(saved); } catch (err) { allNotifs = []; }
  }

  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recipientEmail,
    title,
    message,
    projectId,
    subTaskId,
    type, // ASSIGNMENT | SUBMISSION | APPROVAL | REVISION
    createdByName,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  // Keep last 100 notifications
  allNotifs = [newNotif, ...allNotifs].slice(0, 100);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allNotifs));

  // Push to Cloud API for cross-device instant sync
  sendGlobalNotification(null, newNotif);

  // Trigger custom event so reactive UI components can update immediately
  window.dispatchEvent(new CustomEvent('tp_notification_created', { detail: newNotif }));

  return newNotif;
}

export function markNotificationAsRead(notifId) {
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!saved) return;
  try {
    let allNotifs = JSON.parse(saved);
    allNotifs = allNotifs.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allNotifs));
    window.dispatchEvent(new CustomEvent('tp_notification_updated'));
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

export function markAllNotificationsAsRead(userEmail) {
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!saved) return;
  try {
    let allNotifs = JSON.parse(saved);
    allNotifs = allNotifs.map(n => n.recipientEmail.toLowerCase() === userEmail.toLowerCase() ? { ...n, isRead: true } : n);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allNotifs));
    window.dispatchEvent(new CustomEvent('tp_notification_updated'));
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}
