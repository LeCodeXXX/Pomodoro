import { Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { AuthRequest } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";
import * as documentServices from "../services/documentServices";
import aiService from "../services/aiService";
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
 *
 * Flow:
 *  1. Frontend sends a file + quiz settings (difficulty, questionType, numQuestions, quizLabel).
 *  2. We forward the file to the Python AI service to extract text.
 *  3. We send the extracted text + quiz config to the AI service to generate questions via Gemini.
 *  4. We persist the Quiz, Questions, and QuestionOptions in PostgreSQL via Prisma.
 *  5. We return the saved quiz (with its questions) to the frontend.
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

        let filePath = file?.path;
        let originalFilename = file?.originalname;
        let title = (quizLabel as string) || "Quiz";

        if (!filePath) {
            if (!documentId) {
                res.status(400).json({ error: "Provide either an uploaded file or a documentId" });
                return;
            }

            const document = await documentServices.getDocumentById(documentId, userId);
            filePath = path.join(process.cwd(), document.fileUrl);
            originalFilename = path.basename(document.fileUrl);
            title = (quizLabel as string) || document.title;

            if (!fs.existsSync(filePath)) {
                res.status(404).json({ error: "Source document file was not found on disk" });
                return;
            }
        }

        // Determine the original file extension from the stored file on disk.
        // The upload middleware may have converted DOCX → PDF, so we derive
        // the type from the actual file that exists.
        const safeTitle =
            title || path.basename(originalFilename || "quiz", path.extname(originalFilename || ""));

        // ── Step 1: Extract text via the AI service ────────────────────────
        console.log(`[Quiz] Step 1: Sending file for extraction — ${path.basename(filePath)}`);
        let docResult;
        try {
            docResult = await aiService.processDocument(
                filePath,
                originalFilename || path.basename(filePath),
                userId,
                safeTitle
            );
        } catch (err: any) {
            const details = formatErrorDetails(err);
            console.error("[Quiz] Document extraction failed:", details);
            res.status(500).json({
                error: "Failed to extract text from document",
                details,
            });
            return;
        }

        if (docResult.status !== "success") {
            res.status(500).json({
                error: docResult.error || "Document extraction failed",
            });
            return;
        }

        // ── Step 2: Generate quiz via the AI service ───────────────────────
        // Map the frontend enum values to the Python service's snake_case format
        const difficultyMap: Record<string, string> = {
            EASY: "easy",
            MEDIUM: "medium",
            HARD: "hard",
        };
        const questionTypeMap: Record<string, string> = {
            MULTIPLE_CHOICE: "multiple_choice",
            IDENTIFICATION: "identification",
            TRUE_FALSE: "true_false",
        };

        const aiDifficulty = difficultyMap[difficulty] || difficulty.toLowerCase();
        const aiQuestionType = questionTypeMap[questionType] || questionType.toLowerCase();

        console.log(
            `[Quiz] Step 2: Generating ${numQuestions} ${aiDifficulty} ${aiQuestionType} questions`
        );

        let quizResult;
        try {
            quizResult = await aiService.generateQuiz(
                docResult.document_id,
                docResult.content.raw_text,
                {
                    difficulty: aiDifficulty,
                    question_type: aiQuestionType,
                    num_questions: parseInt(numQuestions, 10),
                    quiz_label: quizLabel,
                    focus_topics: typeof focusTopics === "string" ? focusTopics.trim() : "",
                },
                userId
            );
        } catch (err: any) {
            const details = formatErrorDetails(err);
            console.error("[Quiz] Quiz generation failed:", details);
            res.status(500).json({
                error: "Failed to generate quiz",
                details,
            });
            return;
        }

        if (quizResult.status !== "success") {
            res.status(500).json({
                error: quizResult.error || "Quiz generation failed",
            });
            return;
        }

        // ── Step 3: Persist to database ────────────────────────────────────
        console.log(
            `[Quiz] Step 3: Saving quiz with ${quizResult.questions.length} questions to database`
        );

        // Map difficulty/questionType to Prisma enum values
        const prismaDifficulty = difficulty as "EASY" | "MEDIUM" | "HARD";
        const prismaQuestionType = questionType as "MULTIPLE_CHOICE" | "IDENTIFICATION" | "TRUE_FALSE";

        const savedQuiz = await prisma.quiz.create({
            data: {
                title: quizResult.quiz.title,
                label: quizResult.quiz.label,
                difficulty: prismaDifficulty,
                questionType: prismaQuestionType,
                totalQuestions: quizResult.questions.length,
                userId,
                documentId: documentId || null,
                questions: {
                    create: quizResult.questions.map((q: any) => ({
                        question: q.question,
                        answer: q.correct_answer,
                        explanation: q.explanation || "",
                        options: {
                            create:
                                q.options?.map((opt: any) => ({
                                    optionText: opt.text,
                                    isCorrect: opt.is_correct,
                                })) || [],
                        },
                    })),
                },
            },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });

        console.log(`[Quiz] Done — quiz ${savedQuiz.id} saved successfully`);

        res.status(201).json({
            success: true,
            quiz: savedQuiz,
            metadata: quizResult.metadata,
        });
    } catch (error: any) {
        console.error("[Quiz] Unexpected error:", error);
        res.status(500).json({
            error: error.message || "Failed to generate quiz",
        });
    }
};

/**
 * Retrieve all quizzes generated for a given document.
 * Returns newest-first with questions and options included so the frontend
 * can reopen past quizzes without calling the AI service again.
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

        await documentServices.getDocumentById(documentId, userId);

        const quizzes = await prisma.quiz.findMany({
            where: {
                documentId,
                userId,
            },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            quizzes,
        });
    } catch (error: any) {
        console.error("[Quiz] Failed to fetch quizzes by document:", error);
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
