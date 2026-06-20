import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname);
        const baseName = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .substring(0, 80);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, TXT, DOCX`));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
});
