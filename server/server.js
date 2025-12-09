import 'dotenv/config';

import http from 'http';
import express from "express";
import config from "./config/config.js";
import mongoose from "mongoose";

import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";

import { initializeColyseus } from './colyseus/index.js';

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
    origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
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
  });

// Create HTTP server and attach Colyseus
const httpServer = http.createServer(app);
initializeColyseus(httpServer, app);

httpServer.listen(config.port, (err) => {
  if (err) console.error(`Error starting server: ${err}`);
  config.env === 'development'
    ? console.log(`Server + Colyseus running on http://localhost:${config.port}/`)
    : console.log(`Server + Colyseus running on https://familyfeud-server.onrender.com`);
});