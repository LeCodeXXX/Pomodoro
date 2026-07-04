import { prisma } from "../lib/prisma";

type QuizResponseMap = Record<string, string>;

function normalizeText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isIdentificationQuestion(questionType: string | undefined) {
    return (questionType || "").toLowerCase() === "identification";
}

export const recordQuizAttempt = async ({
    quizId,
    userId,
    responses,
}: {
    quizId: string;
    userId: string;
    responses: QuizResponseMap;
}) => {
    const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, userId },
        include: {
            questions: {
                include: {
                    options: true,
                },
            },
        },
    });

    if (!quiz) {
        throw new Error("Quiz not found or access denied");
    }

    const answers = quiz.questions.map((question) => {
        const userAnswer = responses[question.id] ?? "";
        const correctAnswer = question.answer || "";
        const selectedOption = question.options.find((option) => option.id === userAnswer);

        const isCorrect = isIdentificationQuestion(quiz.questionType)
            ? normalizeText(userAnswer) === normalizeText(correctAnswer)
            : selectedOption
              ? Boolean(selectedOption.isCorrect)
              : userAnswer === correctAnswer;

        return {
            questionId: question.id,
            userAnswer,
            isCorrect,
        };
    });

    const score = answers.reduce((runningScore, answer) => runningScore + (answer.isCorrect ? 1 : 0), 0);

    const attempt = await prisma.quizAttempt.create({
        data: {
            score,
            totalQuestions: quiz.totalQuestions || quiz.questions.length,
            userId,
            quizId,
            answers: {
                create: answers,
            },
        },
        include: {
            answers: {
                include: {
                    question: true,
                },
            },
        },
    });

    return attempt;
};

export const getQuizAttemptsSummary = async ({
    quizId,
    userId,
}: {
    quizId: string;
    userId: string;
}) => {
    const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, userId },
        select: {
            id: true,
            title: true,
            totalQuestions: true,
        },
    });

    if (!quiz) {
        throw new Error("Quiz not found or access denied");
    }

    const attempts = await prisma.quizAttempt.findMany({
        where: { quizId, userId },
        include: {
            answers: {
                include: {
                    question: {
                        select: {
                            id: true,
                            question: true,
                            answer: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            completedAt: "desc",
        },
    });

    const totalAttempts = attempts.length;
    const totalQuestions = quiz.totalQuestions || 0;
    const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
    const averageScore =
        totalAttempts > 0
            ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts
            : 0;
    const averageAccuracy =
        totalAttempts > 0
            ? attempts.reduce((sum, attempt) => {
                const denominator = attempt.totalQuestions || totalQuestions || 1;
                return sum + attempt.score / denominator;
            }, 0) / totalAttempts
            : 0;

    return {
        quiz,
        summary: {
            totalAttempts,
            totalQuestions,
            bestScore,
            averageScore,
            averageAccuracy,
            latestScore: attempts[0]?.score ?? 0,
            latestCompletedAt: attempts[0]?.completedAt ?? null,
        },
        attempts,
    };
};