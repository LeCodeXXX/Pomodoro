import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

class AIService {
    private client = axios.create({
        baseURL: AI_SERVICE_URL,
        timeout: 65000, // 65 seconds — quiz generation can take a while
        headers: {
            "X-API-Key": AI_SERVICE_API_KEY || "",
        },
    });

    /**
     * Send a document file to the Python AI service for text extraction.
     * The AI service expects multipart/form-data with fields: file, file_type, user_id, document_title.
     */
    async processDocument(
        filePath: string,
        originalFilename: string,
        userId: string,
        documentTitle?: string
    ) {
        const fileType = path.extname(originalFilename).replace(".", "").toLowerCase();

        const form = new FormData();
        form.append("file", fs.createReadStream(filePath), originalFilename);
        form.append("file_type", fileType);
        form.append("user_id", userId);
        if (documentTitle) {
            form.append("document_title", documentTitle);
        }

        const response = await this.client.post("/api/documents/process", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        return response.data;
    }

    /**
     * Send extracted document content and quiz configuration to the Python AI service
     * to generate quiz questions via Gemini.
     */
    async generateQuiz(
        documentId: string,
        extractedContent: string,
        config: {
            difficulty: string;
            question_type: string;
            num_questions: number;
            quiz_label: string;
            focus_topics?: string;
        },
        userId: string
    ) {
        const response = await this.client.post("/api/quiz/generate", {
            document_id: documentId,
            extracted_content: extractedContent,
            quiz_config: config,
            user_id: userId,
        });

        return response.data;
    }

    /**
     * Check if the AI service is reachable.
     */
    async healthCheck() {
        try {
            const response = await this.client.get("/api/health");

            if (response.status !== 200 || response.data?.status !== "healthy") {
                throw {
                    status: "AI_SERVICE_UNAVAILABLE",
                    message: response.data?.detail?.message || response.data?.message || "AI service reported unhealthy status",
                };
            }

            return response.data;
        } catch (error: any) {
            throw {
                status: "AI_SERVICE_UNAVAILABLE",
                message: error.message || error?.response?.data?.detail?.message || "AI service is currently unavailable.",
            };
        }
    }
}

export default new AIService();
