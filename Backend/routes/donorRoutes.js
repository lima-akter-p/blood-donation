import express from 'express';
import { searchDonors } from '../controllers/donor.controller.js';

const router = express.Router();

router.get('/', searchDonors);

export default router;
