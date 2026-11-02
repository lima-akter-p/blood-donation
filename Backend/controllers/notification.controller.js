import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';

const PAGE_SIZE = 15;
const MAX_PAGE = 100000;

export async function getUnreadNotificationCount(req, res) {
  const unreadCount = await Notification.countDocuments({
    recipientId: req.user._id,
    isRead: false,
  });
  res.json({ unreadCount });
}

function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    requestId: notification.requestId.toString(),
    title: notification.title,
    message: notification.message,
    status: notification.status,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export async function getNotifications(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }

  const filter = { recipientId: req.user._id };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    notifications: notifications.map(serializeNotification),
    unreadCount,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function markNotificationRead(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Notification not found.' });
    return;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { $set: { isRead: true } },
    { new: true, runValidators: true },
  );
  if (!notification) {
    res.status(404).json({ message: 'Notification not found.' });
    return;
  }
  res.json({ notification: serializeNotification(notification) });
}

export async function markAllNotificationsRead(req, res) {
  const result = await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { $set: { isRead: true } },
  );
  res.json({ markedRead: result.modifiedCount });
}
