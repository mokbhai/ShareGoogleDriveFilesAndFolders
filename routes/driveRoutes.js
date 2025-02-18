import express from "express";
import {
  listFiles,
  servePdf,
  downloadPdf,
  createShareLink,
  deleteShareLink,
  listShareLinks,
  viewSharedFolder,
  adminShareManager,
} from "../controllers/driveController.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/pdf/:fileId", servePdf);
router.get("/pdf/:fileId/download", downloadPdf);
router.get("/share/:token", viewSharedFolder);

// Admin routes
router.get("/", isAdmin, listFiles);
router.get("/admin/links", isAdmin, listShareLinks);
router.post("/admin/links", isAdmin, createShareLink);
router.delete("/admin/links/:token", isAdmin, deleteShareLink);
router.get("/admin", isAdmin, adminShareManager);

export default router;
