import express from 'express';
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from '../controllers/adminUser.controller.js';
import { getAdminDashboardStats } from '../controllers/donationRequest.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();
const adminOnly = [authenticateToken, authorizeRoles('admin')];

router.get('/users', ...adminOnly, getUsers);
router.get('/dashboard', ...adminOnly, getAdminDashboardStats);
router.patch('/users/:id/status', ...adminOnly, updateUserStatus);
router.patch('/users/:id/role', ...adminOnly, updateUserRole);

export default router;
