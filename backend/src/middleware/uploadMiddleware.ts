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

const multerUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
});

export const upload = {
    single: (fieldName: string) => {
        return (req: any, res: any, next: any) => {
            multerUpload.single(fieldName)(req, res, (err: any) => {
                if (err) {
                    if (err.message && err.message.includes("File too large")) {
                        return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
                    }
                    return res.status(400).json({ error: err.message || "Upload failed" });
                }

                if (!req.file) return next();

                if (
                    req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                    req.file.path.endsWith('.docx')
                ) {
                    const inputPath = req.file.path;
                    const outputFilename = req.file.filename.replace(/\.docx$/i, '.pdf');
                    const outputPath = path.join(req.file.destination, outputFilename);

                    const docxConverter = require('docx-pdf');

                    // docx-pdf hardcodes a console.log of mammoth warnings.
                    // We temporarily mock console.log to suppress this specific warning array.
                    const originalConsoleLog = console.log;
                    console.log = (...args) => {
                        if (Array.isArray(args[0]) && args[0].length > 0 && args[0][0] && args[0][0].type === 'warning') {
                            return; // Suppress
                        }
                        originalConsoleLog.apply(console, args as any);
                    };

                    docxConverter(inputPath, outputPath, (convertErr: any, result: any) => {
                        console.log = originalConsoleLog; // Restore console.log
                        if (convertErr) {
                            return next(convertErr);
                        }

                        // Delete original docx silently
                        fs.unlink(inputPath, (unlinkErr) => {
                            if (unlinkErr) console.error("Failed to delete original DOCX:", unlinkErr);
                        });

                        // Update req.file details so the controller uses the new PDF
                        req.file.filename = outputFilename;
                        req.file.path = outputPath;
                        req.file.mimetype = "application/pdf";

                        next();
                    });
                } else {
                    next();
                }
            });
        };
    }
};
