import express from "express";

import leaderboardController from "../../controllers/leaderboard.controller.js";

const router = express.Router();

router.get("/", leaderboardController.getLeaders);

export default router;
