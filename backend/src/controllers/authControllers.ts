import { NextFunction, Request, Response } from "express";
import * as authServices from "../services/authServices"

//Register a User
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            throw new Error("Name, email, and password are required");
        }

        const { token, user } = await authServices.createAccount({ name, email, password });

        res.status(201).json({ token, user });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

//Login a User
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const { token, user } = await authServices.login({ email, password });

        res.status(200).json({ token, user });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}


//Google OAuth
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const authUrl = await authServices.getGoogleAuthUrl();
        res.redirect(authUrl);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export const googleAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawCode = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
        const code = typeof rawCode === "string" ? rawCode : "";

        if (!code) {
            throw new Error("OAuth code is missing");
        }

        const { token, user } = await authServices.googleAuthCallback(code);
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            throw new Error("FRONTEND_URL is not configured");
        }

        const redirectUrl = new URL(frontendUrl);
        redirectUrl.searchParams.set("token", token);
        redirectUrl.searchParams.set("user", encodeURIComponent(JSON.stringify(user)));

        res.redirect(redirectUrl.toString());
    } catch (error: any) {
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            res.status(500).json({ error: "FRONTEND_URL is not configured" });
            return;
        }
        
        const redirectUrl = new URL(frontendUrl);
        redirectUrl.searchParams.set("error", error.message || "OAuth login failed");
        res.redirect(redirectUrl.toString());
    }
}
