import { Request, Response, NextFunction } from "express";
import aiService from "../services/aiService";

export async function checkAIHealth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        await aiService.healthCheck();

        if (req.originalUrl.endsWith("/quiz/health")) {
            return res.status(200).json({
                status: "ok",
                message: "AI service is healthy.",
            });
        }

        return next();
    } catch {
        return res.status(503).json({
            status: "AI_SERVICE_UNAVAILABLE",
            message: "AI service is currently unavailable."
        });
    }
}