import { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../middleware/authMiddleware";
import * as documentServices from "../services/documentServices";


export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const userId = req.userId!;
        // Use the original filename (without extension) as the title, or allow
        // the client to pass a custom title via the request body.
        const title =
            (req.body.title as string | undefined)?.trim() ||
            path.basename(req.file.originalname, path.extname(req.file.originalname));

        // Build a relative URL path that will be served by the static file middleware
        const fileUrl = `/uploads/${req.file.filename}`;

        const document = await documentServices.createDocument({ userId, title, fileUrl });

        res.status(201).json({ document });
    } catch (error: any) {
        // If multer threw a file-type or size error, return 400
        if (error.message?.includes("Unsupported file type") || error.message?.includes("File too large")) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: error.message || "Failed to upload document" });
    }
};


export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.userId!;
        const documents = await documentServices.getDocumentsByUser(userId);
        res.status(200).json({ documents });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to fetch documents" });
    }
};


export const getDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;
        const document = await documentServices.getDocumentById(id as string, userId);
        res.status(200).json({ document });
    } catch (error: any) {
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};


export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const document = await documentServices.deleteDocument(id as string, userId);

        // Remove the physical file from the uploads directory
        const filePath = path.join(process.cwd(), document.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({ message: "Document deleted successfully" });
    } catch (error: any) {
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};
