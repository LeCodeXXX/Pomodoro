import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import * as userServices from "../services/userServices";

export const getTimerSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const settings = await userServices.getTimerSettings(userId);
        res.status(200).json(settings);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateTimerSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const {
            relaxedWorkTime,
            relaxedBreakTime,
            standardWorkTime,
            standardBreakTime,
            focusedWorkTime,
            focusedBreakTime,
        } = req.body;

        if (
            relaxedWorkTime === undefined ||
            relaxedBreakTime === undefined ||
            standardWorkTime === undefined ||
            standardBreakTime === undefined ||
            focusedWorkTime === undefined ||
            focusedBreakTime === undefined
        ) {
            throw new Error("Missing required timer settings fields");
        }

        const settings = await userServices.updateTimerSettings(userId, {
            relaxedWorkTime: Number(relaxedWorkTime),
            relaxedBreakTime: Number(relaxedBreakTime),
            standardWorkTime: Number(standardWorkTime),
            standardBreakTime: Number(standardBreakTime),
            focusedWorkTime: Number(focusedWorkTime),
            focusedBreakTime: Number(focusedBreakTime),
        });

        res.status(200).json(settings);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
