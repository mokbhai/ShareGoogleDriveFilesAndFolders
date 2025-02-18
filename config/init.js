import { ShareLink } from "../models/shareLink.js";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initializeApp() {
  try {
    // Ensure data directory exists
    const dataDir = new URL("../data", import.meta.url).pathname;
    await mkdir(dataDir, { recursive: true });

    // Initialize ShareLink (creates shareLinks.json if it doesn't exist)
    await ShareLink.initialize();

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error initializing application:", error);
    throw error;
  }
}
