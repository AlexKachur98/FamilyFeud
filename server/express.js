import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";

import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import aiRoutes from './routes/ai.route.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(helmet());
app.use(cors());

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', aiRoutes);

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') res.status(401).json({"error" : err.name + ": " + err.message})
    else if (err) res.status(400).json({"error" : err.name + ": " + err.message})
});

export default app;
