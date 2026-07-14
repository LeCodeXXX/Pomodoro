import { Router } from "express";
import * as userControllers from "../controllers/userControllers";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/users/timer-settings", requireAuth, userControllers.getTimerSettings);
router.put("/users/timer-settings", requireAuth, userControllers.updateTimerSettings);

router.get("/users/stats", requireAuth, userControllers.getUserStats);
router.post("/users/pomodoro-session", requireAuth, userControllers.recordPomodoroSession);
router.get("/users/chart-data", requireAuth, userControllers.getChartData);

export default router;
