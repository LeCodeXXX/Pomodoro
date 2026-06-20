import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import cors from "cors";

dotenv.config();


const app = express();
const PORT = process.env.PORT;

if (!PORT) {
    throw new Error("Please provide a PORT in the .env file");
}

app.use(cors());
app.use(express.json());

//Api Routes
app.use('/api', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})