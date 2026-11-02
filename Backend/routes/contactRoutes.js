import express from 'express';
import {
  getContactMessages,
  markContactMessageRead,
  submitContactMessage,
} from '../controllers/contact.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();
const adminOnly = [authenticateToken, authorizeRoles('admin')];

router.post('/', submitContactMessage);
router.get('/messages', ...adminOnly, getContactMessages);
router.patch('/messages/:id/read', ...adminOnly, markContactMessageRead);

export default router;
