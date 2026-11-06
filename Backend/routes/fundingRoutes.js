import express from 'express';
import {
  createFundingCheckout,
  getFundingHistory,
  getFundingSummary,
  handleFundingCancel,
  handleFundingFailure,
  handleFundingIpn,
  handleFundingSuccess,
} from '../controllers/funding.controller.js';
import { authenticateToken, requireVerifiedDonor } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/success', handleFundingSuccess);
router.post('/failure', handleFundingFailure);
router.post('/cancel', handleFundingCancel);
router.post('/ipn', handleFundingIpn);
router.get('/', authenticateToken, getFundingHistory);
router.get('/summary', authenticateToken, getFundingSummary);
router.post('/checkout', authenticateToken, requireVerifiedDonor, createFundingCheckout);

export default router;
