import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import * as documentServices from "./documentServices";
import aiService from "./aiService";

interface GenerateQuizInput {
    userId: string;
    difficulty: string;
    questionType: string;
    numQuestions: string | number;
    quizLabel: string;
    documentId?: string;
    focusTopics?: string;
    file?: {
        path: string;
        originalname: string;
    };
}

export const generateQuizAndSave = async (input: GenerateQuizInput) => {
    const { userId, difficulty, questionType, numQuestions, quizLabel, documentId, focusTopics, file } = input;

    let filePath = file?.path;
    let originalFilename = file?.originalname;
    let title = (quizLabel as string) || "Quiz";

    if (!filePath) {
        if (!documentId) {
            throw new Error("Provide either an uploaded file or a documentId");
        }

        const document = await documentServices.getDocumentById(documentId, userId);
        filePath = path.join(process.cwd(), document.fileUrl);
        originalFilename = path.basename(document.fileUrl);
        title = (quizLabel as string) || document.title;

        if (!fs.existsSync(filePath)) {
            throw new Error("Source document file was not found on disk");
        }
    }

    const safeTitle =
        title || path.basename(originalFilename || "quiz", path.extname(originalFilename || ""));

    // ── Step 1: Extract text via the AI service ────────────────────────
    console.log(`[Quiz Service] Step 1: Sending file for extraction — ${path.basename(filePath)}`);
    const docResult = await aiService.processDocument(
        filePath,
        originalFilename || path.basename(filePath),
        userId,
        safeTitle
    );

    if (docResult.status !== "success") {
        throw new Error(docResult.error || "Document extraction failed");
    }

    // ── Step 2: Generate quiz via the AI service ───────────────────────
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
        `[Quiz Service] Step 2: Generating ${numQuestions} ${aiDifficulty} ${aiQuestionType} questions`
    );

    const quizResult = await aiService.generateQuiz(
        docResult.document_id,
        docResult.content.raw_text,
        {
            difficulty: aiDifficulty,
            question_type: aiQuestionType,
            num_questions: typeof numQuestions === "string" ? parseInt(numQuestions, 10) : numQuestions,
            quiz_label: quizLabel,
            focus_topics: typeof focusTopics === "string" ? focusTopics.trim() : "",
        },
        userId
    );

    if (quizResult.status !== "success") {
        throw new Error(quizResult.error || "Quiz generation failed");
    }

    // ── Step 3: Persist to database ────────────────────────────────────
    console.log(
        `[Quiz Service] Step 3: Saving quiz with ${quizResult.questions.length} questions to database`
    );

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

    console.log(`[Quiz Service] Done — quiz ${savedQuiz.id} saved successfully`);

    return {
        quiz: savedQuiz,
        metadata: quizResult.metadata,
    };
};

export const getQuizzesByDocumentId = async (documentId: string, userId: string) => {
    // Validate document ownership first
    await documentServices.getDocumentById(documentId, userId);

    return prisma.quiz.findMany({
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
};
