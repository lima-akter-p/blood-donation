import express from "express";
import multer from "multer";
import {
  getCurrentUser,
  loginWithGoogle,
  loginUser,
  registerUser,
  resubmitDonorVerification,
  updateCurrentUser,
  uploadAvatar,
} from "../controllers/auth.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, fieldSize: 20 * 1024, parts: 21 },
  fileFilter(req, file, callback) {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!acceptedTypes.includes(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      return;
    }
    callback(null, true);
  },
});
const privateDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, fieldSize: 20 * 1024, parts: 21 },
  fileFilter(req, file, callback) {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!acceptedTypes.includes(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      return;
    }
    callback(null, true);
  },
});

router.post("/avatar", avatarUpload.single("avatar"), uploadAvatar);
router.post("/register", privateDocumentUpload.single("birthCertificate"), registerUser);
router.post("/login", loginUser);
router.post("/google", privateDocumentUpload.single("birthCertificate"), loginWithGoogle);
router.get("/me", authenticateToken, getCurrentUser);
router.patch("/me", authenticateToken, updateCurrentUser);
router.post(
  "/donor-verification",
  authenticateToken,
  authorizeRoles('donor'),
  privateDocumentUpload.single("birthCertificate"),
  resubmitDonorVerification,
);

export default router;