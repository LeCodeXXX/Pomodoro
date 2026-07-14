import { Router } from "express";
import * as userControllers from "../controllers/userControllers";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/users/timer-settings", requireAuth, userControllers.getTimerSettings);
router.put("/users/timer-settings", requireAuth, userControllers.updateTimerSettings);

export default router;
