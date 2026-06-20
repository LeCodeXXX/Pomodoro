import { NextFunction, Request, Response } from "express";
import * as authServices from "../services/authServices"

//Register a User
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            throw new Error("Name, email, and password are required");
        }

        const user = await authServices.createAccount({ name, email, password });

        res.status(201).json({ user });

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

        const user = await authServices.login({ email, password });

        res.status(200).json({ user });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}