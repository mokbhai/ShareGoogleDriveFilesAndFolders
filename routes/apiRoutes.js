import express from "express";
import {
  getSharedFolderMobile,
  servePdf,
} from "../controllers/apiController.js";

const router = express.Router();

// Handle preflight requests
router.options("/share/:token", (req, res) => {
  res.status(200).end();
});

router.get("/share/:token", getSharedFolderMobile);
router.get("/pdf/:fileId", servePdf);

export default router;
