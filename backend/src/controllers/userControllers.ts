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

export const getUserStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const stats = await userServices.getUserStats(userId);
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const recordPomodoroSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const { duration, completed, breakDuration } = req.body;

        if (duration === undefined || completed === undefined) {
            throw new Error("Missing required session fields");
        }

        const session = await userServices.recordPomodoroSession(
            userId,
            Number(duration),
            Boolean(completed),
            Number(breakDuration ?? 0)
        );
        res.status(201).json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};


export const getChartData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const filter = (req.query.filter as string) || 'weekly';
        if (!['daily', 'weekly', 'monthly'].includes(filter)) {
            throw new Error("Invalid filter. Must be daily, weekly, or monthly.");
        }

        const data = await userServices.getChartData(userId, filter as 'daily' | 'weekly' | 'monthly');
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
