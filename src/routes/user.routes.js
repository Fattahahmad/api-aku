import express from 'express';
import * as userController from '../controllers/user.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/me', requireAuth, userController.getProfile);
router.put('/me', requireAuth, uploadAvatar.single('avatar'), userController.updateProfile);

export default router;