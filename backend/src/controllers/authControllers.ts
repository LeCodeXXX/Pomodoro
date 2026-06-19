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

    } catch (error) {

        next(error);
    }
}