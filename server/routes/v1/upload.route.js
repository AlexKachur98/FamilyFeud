/**
 * @file upload.route.js
 * @author Alex Kachur
 * @since 2025-11-17
 * @purpose Avatar upload endpoint protected by auth.
 */
import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { avatarUpload, handleAvatarUpload } from '../../controllers/upload.controller.js';

export default Router()
  .post('/avatar', authMiddleware.requireSignin, (req, res, next) => {
    avatarUpload(req, res, function (err) {
      if (err) {
        const message = err?.message === 'File too large'
          ? 'Avatar too large (max 2MB)'
          : err?.message || 'Upload failed';
        return res.status(400).json({ message });
      }
      return next();
    });
  }, handleAvatarUpload);
