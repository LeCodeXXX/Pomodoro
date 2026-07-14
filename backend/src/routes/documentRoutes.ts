import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import * as documentControllers from "../controllers/documentControllers";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter";

const router = Router();

// Upload a new study material (multipart/form-data, field name: "file")
router.post("/documents/upload", requireAuth, writeLimiter, upload.single("file"), documentControllers.uploadDocument);

// Get all documents for the authenticated user
router.get("/documents", requireAuth, readLimiter, documentControllers.getDocuments);

// Get a single document by ID
router.get("/documents/:id", requireAuth, readLimiter, documentControllers.getDocument);

// Delete a document by ID
router.delete("/documents/:id", requireAuth, writeLimiter, documentControllers.deleteDocument);

export default router;
