import { Router } from "express";
import * as userControllers from "../controllers/userControllers";
import { requireAuth } from "../middleware/authMiddleware";
import { appLimiter } from "../middleware/rateLimiter";
import { validateBody, timerSettingsSchema } from "../middleware/validationMiddleware";

const router = Router();

router.get("/users/timer-settings", requireAuth, appLimiter, userControllers.getTimerSettings);
router.put("/users/timer-settings", requireAuth, appLimiter, validateBody(timerSettingsSchema), userControllers.updateTimerSettings);

router.get("/users/stats", requireAuth, appLimiter, userControllers.getUserStats);
router.post("/users/pomodoro-session", requireAuth, appLimiter, userControllers.recordPomodoroSession);
router.get("/users/chart-data", requireAuth, appLimiter, userControllers.getChartData);

export default router;
