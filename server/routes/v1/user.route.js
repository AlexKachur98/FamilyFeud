import express from 'express';
import multer from 'multer';

import authMiddleware from '../../middlewares/auth.middleware.js';
import userController from '../../controllers/user.controller.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// Public routes
router.post('/', upload.single('image'), userController.createUser);

// Protected routes
router.get('/:id', authMiddleware.requireSignin, userController.getUser);

// Authorization middleware to ensure user can only access their own data
router.put('/:id', upload.single('image'), authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.updateUser);
router.delete('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.deleteUser);

export default router;