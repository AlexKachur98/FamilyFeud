import express from 'express'
import authController from '../controllers/auth.controller.js'

const router = express.Router();

router.post('/auth/signin', authController.signin);
router.get('/auth/signout', authController.signout);

export default router;
