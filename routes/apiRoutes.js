import express from "express";
import {
  getSharedFolderMobile,
  servePdf,
} from "../controllers/apiController.js";
import { clearRenderedPages } from "../scripts/manageRendered.js";
import { isAdmin } from "../middleware/auth.js";
import { pageRenderer } from "../utils/pageRenderer.js";
import { deployApp } from "../scripts/deploy.js";

const router = express.Router();

// Handle preflight requests
router.options("/share/:token", (req, res) => {
  res.status(200).end();
});

router.get("/share/:token", getSharedFolderMobile);
router.get("/pdf/:fileId", servePdf);

// Add this new route
router.get("/clear-cache", isAdmin, clearRenderedPages);

// Add these new routes
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const stats = await pageRenderer.getPageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/stats/html", isAdmin, async (req, res) => {
  try {
    const stats = await pageRenderer.getPageStats();
    res.render("admin/stats", { stats });
  } catch (error) {
    res.status(500).render("error", {
      error: "Failed to load statistics",
    });
  }
});

// Add deployment route
router.get("/deploy", deployApp);

export default router;
