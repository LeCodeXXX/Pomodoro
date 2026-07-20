import { Router } from "express";
import * as authControllers from "../controllers/authControllers";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter";
import { validateBody, registerSchema, loginSchema } from "../middleware/validationMiddleware";

const router = Router();

router.post("/auth/register", registerLimiter, validateBody(registerSchema), authControllers.registerUser);
router.post("/auth/login", loginLimiter, validateBody(loginSchema), authControllers.loginUser);

//OAuth routes for Google
router.get("/auth/google", authControllers.googleAuth);
router.get("/auth/google/callback", authControllers.googleAuthCallback);

export default router;