import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import * as quizServices from "../services/quizServices";
import * as quizAttemptServices from "../services/quizAttemptServices";

function formatErrorDetails(error: any): string {
    if (!error) {
        return "Unknown error";
    }

    if (typeof error === "string") {
        return error;
    }

    const responseDetails = error.response?.data;
    if (typeof responseDetails === "string") {
        return responseDetails;
    }

    if (responseDetails && typeof responseDetails === "object") {
        return responseDetails.detail || responseDetails.error || JSON.stringify(responseDetails);
    }

    return error.message || error.code || error.toString?.() || "Unknown error";
}

/**
 * Generate a quiz from an uploaded document.
 */
export const generateQuiz = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { difficulty, questionType, numQuestions, quizLabel, documentId, focusTopics } = req.body;
        const file = req.file;

        // Validate required quiz config fields
        if (!difficulty || !questionType || !numQuestions || !quizLabel) {
            res.status(400).json({
                error: "Missing required fields: difficulty, questionType, numQuestions, quizLabel",
            });
            return;
        }

        const result = await quizServices.generateQuizAndSave({
            userId,
            difficulty,
            questionType,
            numQuestions,
            quizLabel,
            documentId,
            focusTopics,
            file,
        });

        res.status(201).json({
            success: true,
            quiz: result.quiz,
            metadata: result.metadata,
        });
    } catch (error: any) {
        console.error("[Quiz Controller] Error generating quiz:", error);
        const details = formatErrorDetails(error);
        res.status(500).json({
            error: error.message || "Failed to generate quiz",
            details,
        });
    }
};

/**
 * Retrieve all quizzes generated for a given document.
 */
export const getQuizzesByDocument = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { documentId: rawDocumentId } = req.params;

        if (Array.isArray(rawDocumentId)) {
            res.status(400).json({ error: "documentId must be a single value" });
            return;
        }

        const documentId = rawDocumentId;

        if (!documentId) {
            res.status(400).json({ error: "documentId is required" });
            return;
        }

        const quizzes = await quizServices.getQuizzesByDocumentId(documentId, userId);

        res.status(200).json({
            quizzes,
        });
    } catch (error: any) {
        console.error("[Quiz Controller] Failed to fetch quizzes by document:", error);
        res.status(500).json({
            error: error.message || "Failed to fetch quizzes",
        });
    }
};

export const saveQuizAttempt = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { quizId: rawQuizId } = req.params;
        const { responses = {} } = req.body;

        if (!rawQuizId || Array.isArray(rawQuizId)) {
            res.status(400).json({ error: "quizId is required" });
            return;
        }

        const quizId = rawQuizId;

        const attempt = await quizAttemptServices.recordQuizAttempt({
            quizId,
            userId,
            responses,
        });

        res.status(201).json({
            attempt,
        });
    } catch (error: any) {
        console.error("[Quiz] Failed to save quiz attempt:", error);
        res.status(500).json({
            error: error.message || "Failed to save quiz attempt",
        });
    }
};

export const getQuizAttempts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { quizId: rawQuizId } = req.params;

        if (!rawQuizId || Array.isArray(rawQuizId)) {
            res.status(400).json({ error: "quizId is required" });
            return;
        }

        const quizId = rawQuizId;

        const result = await quizAttemptServices.getQuizAttemptsSummary({
            quizId,
            userId,
        });

        res.status(200).json(result);
    } catch (error: any) {
        console.error("[Quiz] Failed to load quiz attempts:", error);
        res.status(500).json({
            error: error.message || "Failed to load quiz attempts",
        });
    }
};
