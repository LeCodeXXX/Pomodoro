import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import * as quizControllers from "../controllers/quizControllers";
import { generateQuizLimiter } from "../middleware/rateLimiter";

const router = Router();

// Generate a quiz from an uploaded document
// Expects multipart/form-data with field "file" and body fields:
//   difficulty    (EASY | MEDIUM | HARD)
//   questionType  (MULTIPLE_CHOICE | IDENTIFICATION)
//   numQuestions   (number, 1–50)
//   quizLabel      (string, e.g. "Biology")
//   documentId     (optional, UUID of an existing document to link)
router.post(
    "/quiz/generate",
    requireAuth,
    upload.single("file"),
    generateQuizLimiter,
    quizControllers.generateQuiz
);

router.get(
    "/quiz/document/:documentId",
    requireAuth,
    quizControllers.getQuizzesByDocument
);

router.post(
    "/quiz/:quizId/attempts",
    requireAuth,
    quizControllers.saveQuizAttempt
);

router.get(
    "/quiz/:quizId/attempts",
    requireAuth,
    quizControllers.getQuizAttempts
);

export default router;
