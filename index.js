import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import driveRoutes from "./routes/driveRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import { initializeApp } from "./config/init.js";
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
app.use(express.static(join(__dirname, "public")));
app.use(express.json());

// Routes
app.use("/", driveRoutes);
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;

// Initialize app before starting server
initializeApp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  });
