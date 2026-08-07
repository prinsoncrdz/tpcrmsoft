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
