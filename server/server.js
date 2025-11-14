import 'dotenv/config';

import path from 'node:path';
import express from "express";
import config from "./config/config.js";
import mongoose from "mongoose";

import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";

import rateLimit from './middlewares/rateLimiter.js'
import apiRouter from './api-router.js';

try {
  try {
    mongoose.connect(config.mongoUri);
  } catch (e) {
    console.error(`⚠️ Error connecting to: ${config.mongoUri}`);
  };

  console.log("✅ MongoDB connected successfully.");

  mongoose.connection.on('error', (e) => {
    throw new Error(`⚠️ Connection Error: ${e}`);
  });
} catch (e) {
  console.error('MongoDB connection error:', e);
};

const app = express();
app
  .use(cors({
    origin: process.env.VITE_CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }))
  .use(compress())
  .use(cookieParser())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(helmet())

apiRouter(app);

app
  .use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') return res.status(401).json({ "error": err.name + ": " + err.message })
  })

  .get(/^(?!\/api).*/, rateLimit, (_, res) => {
    res.json({ message: "Welcome to Family Feud!" });
    // res.sendFile(path.join(process.cwd(), 'client/dist', 'index.html'));
  })

  .listen(config.port, (err) => {
    if (err) console.error(`Error starting server: ${err}`);
    config.env === 'development'
      ? console.log(`Server running on http://localhost:${config.port}/`)
      : console.log(`Server running on https://dailygrind-server.onrender.com`);
  });
