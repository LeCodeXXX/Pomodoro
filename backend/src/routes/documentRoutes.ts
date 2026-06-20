import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import * as documentControllers from "../controllers/documentControllers";

const router = Router();

// Upload a new study material (multipart/form-data, field name: "file")
router.post("/documents/upload", requireAuth, upload.single("file"), documentControllers.uploadDocument);

// Get all documents for the authenticated user
router.get("/documents", requireAuth, documentControllers.getDocuments);

// Get a single document by ID
router.get("/documents/:id", requireAuth, documentControllers.getDocument);

// Delete a document by ID
router.delete("/documents/:id", requireAuth, documentControllers.deleteDocument);

export default router;
