import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "./auth";

// Extend Express Request to include the decoded JWT payload
export interface AuthRequest extends Request {
    user?: JwtPayload;
    userId?: string;
}

/**
 * JWT auth middleware.
 * Expects an `Authorization: Bearer <token>` header.
 * Attaches the decoded payload to `req.user` on success.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing or malformed token" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyToken(token);
        req.user = payload;
        req.userId = payload.userId;
        next();
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            res.status(401).json({ error: "Unauthorized: Token has expired" });
        } else {
            res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    }
};

