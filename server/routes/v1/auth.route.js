import { Router } from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import authController from '../../controllers/auth.controller.js';

export default Router()
  .get('/validate', authMiddleware.requireSignin, (req, res) => res.json({ valid: true, user: req.user }))
  .post('/signup', authController.signup)
  .post('/signin', authController.signin)
  .get('/signout', authController.signout);
