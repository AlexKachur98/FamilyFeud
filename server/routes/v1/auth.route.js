import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

export default Router()
  .get('/validate', authMiddleware.requireSignin)
  .post('/signup', authController.signup)
  .post('/signin', authController.signin)
  .get('/signout', authController.signout);
