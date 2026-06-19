import { Router } from "express";
import * as authControllers from "../controllers/authControllers";

const router = Router();

router.post("/auth/register", authControllers.registerUser);

export default router;