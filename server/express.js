import express from "express";
import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";

import userRoutes from './routes/user.route.js';
import questionRoutes from './routes/question.route.js';
import authRoutes from './routes/auth.route.js';
import aiRoutes from './routes/ai.route.js';


const app = express();


app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(compress());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/', questionRoutes);
app.use('/', aiRoutes);

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') return res.status(401).json({ "error": err.name + ": " + err.message })
    // else if (err) res.status(400).json({ "error": err.name + ": " + err.message })
});

export default app;
