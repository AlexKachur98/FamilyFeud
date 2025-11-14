import express from 'express';
import userController from '../../controllers/user.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', userController.createUser);

router.get('/:id', authMiddleware.requireSignin, userController.getUser);
router.put('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.updateUser);
router.delete('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, userController.deleteUser);

export default router;