import { Request, Response, NextFunction } from "express";

// Extend Express Request to include userId
export interface AuthRequest extends Request {
    userId?: string;
}

/**
 * Simple auth middleware that reads userId from request headers.
 * The frontend passes the logged-in user's id as 'x-user-id'.
 * In the future this should be replaced with JWT verification.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.headers["x-user-id"] as string | undefined;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized: Missing user ID header" });
        return;
    }

    req.userId = userId;
    next();
};
