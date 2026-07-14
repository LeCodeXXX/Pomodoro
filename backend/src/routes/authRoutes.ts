import { Router } from "express";
import * as authControllers from "../controllers/authControllers";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/auth/register", registerLimiter, authControllers.registerUser);
router.post("/auth/login", loginLimiter, authControllers.loginUser);

export default router;