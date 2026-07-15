import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

// Helper to sanitize string inputs by trimming them and stripping HTML/script tags.
export const sanitizeString = (val: string): string => {
    if (typeof val !== "string") {
        return val;
    }
    return val.trim().replace(/<[^>]*>/g, "");
};

// Generic validation middleware
export const validateBody = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                console.error("[Validation Error]", error);
                const issues = error.issues || [];
                res.status(400).json({
                    error: issues[0]?.message || "Validation failed",
                    details: issues.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};

// User Registration Schema
export const registerSchema = z.object({
    name: z.string()
        .transform((val) => sanitizeString(val))
        .refine((val) => val.length >= 2, { message: "Name must be at least 2 characters long" })
        .refine((val) => val.length <= 100, { message: "Name cannot exceed 100 characters" }),
    email: z.string()
        .trim()
        .email({ message: "Invalid email address" })
        .transform((val) => val.toLowerCase()),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(100, { message: "Password cannot exceed 100 characters" })
});

// User Login Schema
export const loginSchema = z.object({
    email: z.string()
        .trim()
        .email({ message: "Invalid email address" })
        .transform((val) => val.toLowerCase()),
    password: z.string()
        .min(1, { message: "Password is required" })
});

// Timer Settings Schema (durations in seconds)
export const timerSettingsSchema = z.object({
    relaxedWorkTime: z.coerce.number().int()
        .min(60, { message: "Relaxed work time must be at least 1 minute (60 seconds)" })
        .max(7200, { message: "Relaxed work time cannot exceed 120 minutes (7200 seconds)" }),
    relaxedBreakTime: z.coerce.number().int()
        .min(60, { message: "Relaxed break time must be at least 1 minute (60 seconds)" })
        .max(3600, { message: "Relaxed break time cannot exceed 60 minutes (3600 seconds)" }),
    standardWorkTime: z.coerce.number().int()
        .min(60, { message: "Standard work time must be at least 1 minute (60 seconds)" })
        .max(7200, { message: "Standard work time cannot exceed 120 minutes (7200 seconds)" }),
    standardBreakTime: z.coerce.number().int()
        .min(60, { message: "Standard break time must be at least 1 minute (60 seconds)" })
        .max(3600, { message: "Standard break time cannot exceed 60 minutes (3600 seconds)" }),
    focusedWorkTime: z.coerce.number().int()
        .min(60, { message: "Locked-in work time must be at least 1 minute (60 seconds)" })
        .max(7200, { message: "Locked-in work time cannot exceed 120 minutes (7200 seconds)" }),
    focusedBreakTime: z.coerce.number().int()
        .min(60, { message: "Locked-in break time must be at least 1 minute (60 seconds)" })
        .max(3600, { message: "Locked-in break time cannot exceed 60 minutes (3600 seconds)" }),
});

// Quiz Generation Schemass
export const quizGenerateSchema = z.object({
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"], {
        error: () => ({ message: "Difficulty must be EASY, MEDIUM, or HARD" })
    }),
    questionType: z.enum(["MULTIPLE_CHOICE", "IDENTIFICATION", "TRUE_FALSE"], {
        error: () => ({ message: "Question type must be MULTIPLE_CHOICE, IDENTIFICATION, or TRUE_FALSE" })
    }),
    numQuestions: z.coerce.number().int()
        .min(1, { message: "Number of questions must be at least 1" })
        .max(50, { message: "Number of questions cannot exceed 50" }),
    quizLabel: z.string()
        .transform((val) => sanitizeString(val))
        .refine((val) => val.length >= 1, { message: "Quiz label is required" })
        .refine((val) => val.length <= 200, { message: "Quiz label cannot exceed 200 characters" }),
    documentId: z.string().uuid({ message: "Invalid document ID format" }).optional().or(z.literal("")),
    focusTopics: z.string()
        .optional()
        .transform((val) => val ? sanitizeString(val) : undefined)
});
