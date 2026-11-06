import express from 'express';
import {
  createDonationRequest,
  confirmDonation,
  deleteDonationRequest,
  getDonationRequest,
  getAllDonationRequests,
  getMyDonationRequests,
  getPendingDonationRequestDetails,
  getPendingDonationRequests,
  updateDonationRequest,
  updateDonationRequestStatus,
} from '../controllers/donationRequest.controller.js';
import {
  authenticateToken,
  authorizeRoles,
  requireVerifiedDonor,
} from '../middleware/auth.middleware.js';

const router = express.Router();
const donorOrAdmin = [authenticateToken, requireVerifiedDonor, authorizeRoles('donor', 'admin')];
const requestOwnerOrAdmin = [
  authenticateToken,
  requireVerifiedDonor,
  authorizeRoles('donor', 'volunteer', 'admin'),
];

router.get('/', getPendingDonationRequests);
router.post('/', ...donorOrAdmin, createDonationRequest);
router.get('/mine', ...donorOrAdmin, getMyDonationRequests);
router.get('/all', authenticateToken, authorizeRoles('volunteer', 'admin'), getAllDonationRequests);
router.get('/all/:id', authenticateToken, authorizeRoles('admin'), getDonationRequest);
router.patch('/all/:id', authenticateToken, authorizeRoles('admin'), updateDonationRequest);
router.delete('/all/:id', authenticateToken, authorizeRoles('admin'), deleteDonationRequest);
router.get('/mine/:id', ...requestOwnerOrAdmin, getDonationRequest);
router.get('/:id', authenticateToken, getPendingDonationRequestDetails);
router.post('/:id/donate', authenticateToken, requireVerifiedDonor, authorizeRoles('donor'), confirmDonation);
router.patch('/:id', ...requestOwnerOrAdmin, updateDonationRequest);
router.patch(
  '/:id/status',
  authenticateToken,
  requireVerifiedDonor,
  authorizeRoles('donor', 'volunteer', 'admin'),
  updateDonationRequestStatus,
);
router.delete('/:id', ...requestOwnerOrAdmin, deleteDonationRequest);

export default router;
