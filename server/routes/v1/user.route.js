import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import userController from '../../controllers/user.controller.js';

const router = express.Router();

// Public routes
router.post('/', userController.createUser);

// Protected routes
router.get('/:id', authMiddleware.requireSignin, userController.getUser);

// Authorization middleware to ensure user can only access their own data
router.put('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.updateUser);
router.delete('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.deleteUser);

export default router;