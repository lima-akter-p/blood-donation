import express from "express";
import multer from "multer";
import {
  getCurrentUser,
  loginWithGoogle,
  loginUser,
  registerUser,
  updateCurrentUser,
  uploadAvatar,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
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
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle);
router.get("/me", authenticateToken, getCurrentUser);
router.patch("/me", authenticateToken, updateCurrentUser);

export default router;