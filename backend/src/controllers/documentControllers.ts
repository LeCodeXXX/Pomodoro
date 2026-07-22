import { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../middleware/authMiddleware";
import * as documentServices from "../services/documentServices";
import { supabase } from "../utils/supabase";

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "documents";

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let tempFilePath: string | null = req.file?.path || null;

    try {
        if (!req.file || !tempFilePath) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const userId = req.userId!;
        // Use the original filename (without extension) as the title, or allow
        // the client to pass a custom title via the request body.
        const title =
            (req.body.title as string | undefined)?.trim() ||
            path.basename(req.file.originalname, path.extname(req.file.originalname));

        // Read file buffer from temporary disk location
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fileName = req.file.filename || `${Date.now()}-${req.file.originalname}`;
        const storagePath = `${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: req.file.mimetype || "application/pdf",
                upsert: true,
            });

        // Clean up temp file from disk immediately after reading/uploading
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            tempFilePath = null;
        }

        if (uploadError) {
            console.error("Supabase storage error:", uploadError);
            res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });
            return;
        }

        // Generate public URL for the uploaded document
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        const fileUrl = publicUrlData.publicUrl;

        // Save metadata record into Neon PostgreSQL
        const document = await documentServices.createDocument({ userId, title, fileUrl });

        res.status(201).json({ document });
    } catch (error: any) {
        // Clean up temp file on failure if not already cleaned
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error("Failed to clean up temp file:", err);
            }
        }

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

        // Delete the file from Supabase Storage if it's a full remote URL
        if (document.fileUrl.startsWith("http")) {
            const urlMarker = `/storage/v1/object/public/${BUCKET_NAME}/`;
            const markerIndex = document.fileUrl.indexOf(urlMarker);
            if (markerIndex !== -1) {
                const storagePath = document.fileUrl.substring(markerIndex + urlMarker.length);
                const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
                if (removeError) {
                    console.error("Failed to delete file from Supabase storage:", removeError);
                }
            }
        } else {
            // Fallback for legacy files stored locally on disk
            const filePath = path.join(process.cwd(), document.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(200).json({ message: "Document deleted successfully" });
    } catch (error: any) {
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};
