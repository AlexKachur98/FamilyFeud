
import express from 'express';

import userRoutes from './routes/v1/user.route.js';
import questionRoutes from './routes/v1/question.route.js';
import authRoutes from './routes/v1/auth.route.js';
import aiRoutes from './routes/v1/ai.route.js';


export default (/**@type {express.Express} */app) => {
  app
    .use('/api/v1/auth', authRoutes)
    .use('/api/v1/user', userRoutes)
    .use('/api/v1/question', questionRoutes)
    .use('/api/v1/ai', aiRoutes)

};
