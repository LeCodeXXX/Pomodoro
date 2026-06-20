import { Router } from "express";
import * as authControllers from "../controllers/authControllers";

const router = Router();

router.post("/auth/register", authControllers.registerUser);
router.post("/auth/login", authControllers.loginUser);

export default router;