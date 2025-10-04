import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Global error handler
app.use(errorHandler);

export default app;
