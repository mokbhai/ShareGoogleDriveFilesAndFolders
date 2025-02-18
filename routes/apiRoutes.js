import express from "express";
import {
  getSharedFolderMobile,
  servePdf,
} from "../controllers/apiController.js";
import { clearRenderedPages } from "../scripts/manageRendered.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Handle preflight requests
router.options("/share/:token", (req, res) => {
  res.status(200).end();
});

router.get("/share/:token", getSharedFolderMobile);
router.get("/pdf/:fileId", servePdf);

// Add this new route
router.post("/clear-cache", isAdmin, clearRenderedPages);

export default router;
