import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import documentRoutes from "./routes/documentRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

if (!PORT) {
    throw new Error("Please provide a PORT in the .env file");
}

app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Api Routes
app.use("/api", authRoutes);
app.use("/api", documentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});