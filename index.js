import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import driveRoutes from "./routes/driveRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initializeApp } from "./config/init.js";
import { hitCounter } from "./utils/hitCounter.js";
import { requireAuth, setUserIfExists } from "./middleware/authMiddleware.js";
import { initRedis } from "./config/redis.js";
// import cors from "cors";

// Initialize environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// app.use(cors());

// Set view engine
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// Middleware
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));
app.use(express.json());
app.use(setUserIfExists);

// Routes
app.use("/auth", authRoutes);
app.use("/", driveRoutes);
app.use("/api", requireAuth, apiRoutes);

// 404 handler - add this after all other routes
app.use((req, res) => {
  res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;

// Initialize app before starting server
initializeApp()
  .then(async () => {
    try {
      await initRedis(); // Initialize Redis connection
      await hitCounter.initialize();
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to initialize Redis or hit counter:", error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  });
