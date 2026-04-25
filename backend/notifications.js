const fs = require("fs");
const path = require("path");

// Path to notifications.json
const filePath = path.join(__dirname, "notifications.json");

// Load notifications from JSON
function loadNotifications() {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Save notifications to JSON
function saveNotifications(notifications) {
  fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
}

// Create a notification
function createNotification({ userId, type, title, message }) {
  const notifications = loadNotifications();
  const newNotification = {
    id: Date.now(), // simple unique ID
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(newNotification);
  saveNotifications(notifications);
  return newNotification;
}

// Get notifications for a user
function getNotifications(userId) {
  const notifications = loadNotifications();
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Mark a notification as read
function markAsRead(notificationId) {
  const notifications = loadNotifications();
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    saveNotifications(notifications);
    return notif;
  }
  return null;
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
};