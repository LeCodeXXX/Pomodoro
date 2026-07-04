import { Response, NextFunction } from "express";
import path from "path";
import { AuthRequest } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";
import aiService from "../services/aiService";

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
        const { difficulty, questionType, numQuestions, quizLabel, documentId } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        // Validate required quiz config fields
        if (!difficulty || !questionType || !numQuestions || !quizLabel) {
            res.status(400).json({
                error: "Missing required fields: difficulty, questionType, numQuestions, quizLabel",
            });
            return;
        }

        // Determine the original file extension from the stored file on disk.
        // The upload middleware may have converted DOCX → PDF, so we derive
        // the type from the actual file that exists.
        const fileExt = path.extname(file.filename).replace(".", "").toLowerCase();
        const title =
            (quizLabel as string) ||
            path.basename(file.originalname, path.extname(file.originalname));

        // ── Step 1: Extract text via the AI service ────────────────────────
        console.log(`[Quiz] Step 1: Sending file for extraction — ${file.filename}`);
        let docResult;
        try {
            docResult = await aiService.processDocument(
                file.path,
                file.originalname,
                userId,
                title
            );
        } catch (err: any) {
            console.error("[Quiz] Document extraction failed:", err.message);
            res.status(500).json({
                error: "Failed to extract text from document",
                details: err.response?.data || err.message,
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
                },
                userId
            );
        } catch (err: any) {
            console.error("[Quiz] Quiz generation failed:", err.message);
            res.status(500).json({
                error: "Failed to generate quiz",
                details: err.response?.data || err.message,
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
        const prismaQuestionType = questionType as "MULTIPLE_CHOICE" | "IDENTIFICATION";

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
