import { getDriveService } from "../config/googleDrive.js";
import NodeCache from "node-cache";
import compression from "compression";
import { ShareLink } from "../models/shareLink.js";
import { pageRenderer } from "../utils/pageRenderer.js";

// Initialize cache with 30 minutes TTL
const cache = new NodeCache({ stdTTL: 1800 });

// Compress responses
const compressResponse = compression({
  level: 6, // Compression level (0-9)
  threshold: "1kb", // Only compress responses larger than 1kb
});

function isMobileDevice(req) {
  const userAgent = req.headers["user-agent"].toLowerCase();
  return /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}

export const listFiles = async (req, res) => {
  try {
    const folderId = req.query.folderId || "root";
    const drive = await getDriveService();

    // First, let's check if we can access the Drive API
    try {
      const about = await drive.about.get({
        fields: "user, storageQuota",
      });
      // console.log("Connected as:", about.data.user.emailAddress);
    } catch (error) {
      console.error("Error accessing Drive API:", error.message);
      throw new Error("Failed to access Google Drive API");
    }

    // Get current folder details (if not root)
    let currentFolder = null;
    if (folderId !== "root") {
      try {
        const folderResponse = await drive.files.get({
          fileId: folderId,
          fields: "id, name, parents",
        });
        currentFolder = folderResponse.data;
        // console.log("Current folder:", currentFolder);
      } catch (error) {
        console.error("Error getting folder details:", error.message);
      }
    }

    // Get all folders (not just in current directory)
    const foldersResponse = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, parents)",
      orderBy: "name",
      pageSize: 1000,
    });

    // Get all PDF files
    const filesResponse = await drive.files.list({
      q: `mimeType contains 'pdf' and trashed = false`,
      pageSize: 1000,
      fields:
        "files(id, name, mimeType, createdTime, size, thumbnailLink, parents)",
      orderBy: "createdTime desc",
    });

    // console.log("Total folders found:", foldersResponse.data.files.length);
    // console.log("Total PDF files found:", filesResponse.data.files.length);

    // Filter folders and files for current directory
    const folders = foldersResponse.data.files.filter((folder) => {
      if (folderId === "root") {
        return !folder.parents || folder.parents[0] === "root";
      }
      return folder.parents && folder.parents[0] === folderId;
    });

    const files = filesResponse.data.files.filter((file) => {
      if (folderId === "root") {
        return !file.parents || file.parents[0] === "root";
      }
      return file.parents && file.parents[0] === folderId;
    });

    // console.log("Folders in current directory:", folders.length);
    // console.log("Files in current directory:", files.length);

    // Format files with preview URLs
    const filesWithPreviews = files.map((file) => ({
      ...file,
      previewUrl: `/pdf/${file.id}`,
      downloadUrl: `/pdf/${file.id}/download`,
      formattedSize: formatFileSize(file.size),
    }));

    // Get breadcrumb data
    const breadcrumbs = await getBreadcrumbs(drive, currentFolder);

    const data = {
      currentFolder,
      folders,
      files: filesWithPreviews,
      breadcrumbs,
      serviceEmail: process.env.SERVICE_EMAIL,
      adminKey: req.adminKey,
    };

    res.render("fileList", data);
  } catch (error) {
    console.error("Error listing files:", error.message);
    console.error("Stack trace:", error.stack);

    if (error.message.includes("client_email")) {
      res.status(500).render("error", {
        error:
          "Google Drive API credentials are invalid or missing. Please check your credentials.json file.",
      });
    } else {
      res.status(500).render("error", {
        error:
          "An error occurred while fetching files from Google Drive: " +
          error.message,
      });
    }
  }
};

async function getBreadcrumbs(drive, currentFolder) {
  const breadcrumbs = [];

  if (!currentFolder) {
    return [{ id: "root", name: "Home" }];
  }

  let folder = currentFolder;
  while (folder) {
    breadcrumbs.unshift({ id: folder.id, name: folder.name });

    if (!folder.parents || folder.parents[0] === "root") {
      breadcrumbs.unshift({ id: "root", name: "Home" });
      break;
    }

    try {
      const parentResponse = await drive.files.get({
        fileId: folder.parents[0],
        fields: "id, name, parents",
      });
      folder = parentResponse.data;
    } catch (error) {
      console.error("Error getting parent folder:", error);
      break;
    }
  }

  return breadcrumbs;
}

// Helper function to format file sizes
export function formatFileSize(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// New function to serve PDF content
export const servePdf = async (req, res) => {
  try {
    const { fileId } = req.params;
    const isMobile = isMobileDevice(req);

    // Check cache for file metadata
    const metaCacheKey = `pdf_meta_${fileId}`;
    let fileMetadata = cache.get(metaCacheKey);

    const drive = await getDriveService();

    if (!fileMetadata) {
      const file = await drive.files.get({
        fileId,
        fields: "mimeType, name, size",
      });
      fileMetadata = file.data;
      cache.set(metaCacheKey, fileMetadata);
    }

    if (fileMetadata.mimeType !== "application/pdf") {
      return res.status(400).send("Not a PDF file");
    }

    // Set headers for better caching and compatibility
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Set Content-Disposition based on context
    const disposition = req.query.download ? "attachment" : "inline";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${fileMetadata.name}"`
    );

    // Apply compression for better performance
    compressResponse(req, res, async () => {
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "stream" }
      );

      // Add error handling for the stream
      response.data.on("error", (error) => {
        console.error("Stream error:", error);
        if (!res.headersSent) {
          res.status(500).send("Error streaming PDF");
        }
      });

      response.data.pipe(res);
    });
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).send("Error serving PDF file");
  }
};

// New function to handle downloads
export const downloadPdf = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Check cache for file metadata
    const metaCacheKey = `pdf_meta_${fileId}`;
    let fileMetadata = cache.get(metaCacheKey);

    const drive = await getDriveService();

    if (!fileMetadata) {
      const file = await drive.files.get({
        fileId,
        fields: "mimeType, name",
      });
      fileMetadata = file.data;
      cache.set(metaCacheKey, fileMetadata);
    }

    if (fileMetadata.mimeType !== "application/pdf") {
      return res.status(400).send("Not a PDF file");
    }

    // Apply compression
    compressResponse(req, res, async () => {
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "stream" }
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileMetadata.name}"`
      );
      response.data.pipe(res);
    });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).send("Error downloading PDF file");
  }
};

export const createShareLink = async (req, res) => {
  try {
    const { folderId, name, expiresAt } = req.body;

    // Verify folder exists
    const drive = await getDriveService();
    await drive.files.get({ fileId: folderId });

    const link = await ShareLink.create({ folderId, name, expiresAt });
    res.json(link);
  } catch (error) {
    console.error("Error creating share link:", error);
    res.status(500).json({ error: "Failed to create share link" });
  }
};

export const deleteShareLink = async (req, res) => {
  try {
    await ShareLink.delete(req.params.token);
    res.json({ message: "Share link deleted" });
  } catch (error) {
    console.error("Error deleting share link:", error);
    res.status(500).json({ error: "Failed to delete share link" });
  }
};

export const listShareLinks = async (req, res) => {
  try {
    const links = await ShareLink.getAll();
    res.json(links);
  } catch (error) {
    console.error("Error listing share links:", error);
    res.status(500).json({ error: "Failed to list share links" });
  }
};

export const viewSharedFolder = async (req, res) => {
  try {
    const { token } = req.params;
    const folderId = req.query.folderId;
    const url = `/share/${token}${folderId ? `?folderId=${folderId}` : ""}`;
    const isMobile = isMobileDevice(req);

    // Try to get cached version for the specific device type
    const cachedPage = await pageRenderer.getRenderedPage(url, isMobile);
    if (cachedPage) {
      return res.send(cachedPage);
    }

    // If no cached version, render the page
    const link = await ShareLink.getByToken(token);

    if (!link) {
      return res.status(404).render("error", {
        error: "Share link not found or has expired",
      });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).render("error", {
        error: "This share link has expired",
      });
    }

    const drive = await getDriveService();

    // Verify that the requested folder is within the shared folder tree
    if (folderId && folderId !== link.folderId) {
      let isValidFolder = false;
      let currentFolder = folderId;

      while (currentFolder) {
        try {
          const folderData = await drive.files.get({
            fileId: currentFolder,
            fields: "parents",
          });

          if (!folderData.data.parents) break;
          if (folderData.data.parents[0] === link.folderId) {
            isValidFolder = true;
            break;
          }
          currentFolder = folderData.data.parents[0];
        } catch (error) {
          console.error("Error checking folder ancestry:", error);
          break;
        }
      }

      if (!isValidFolder) {
        return res.status(403).render("error", {
          error: "Access to this folder is not allowed",
        });
      }
    }

    // Get current folder name
    const currentFolderId = folderId || link.folderId;
    let folderName = link.name;

    if (folderId) {
      try {
        const folderData = await drive.files.get({
          fileId: folderId,
          fields: "name",
        });
        folderName = folderData.data.name;
      } catch (error) {
        console.error("Error getting folder name:", error);
      }
    }

    // Get breadcrumbs
    const breadcrumbs = await getSharedBreadcrumbs(
      drive,
      currentFolderId,
      link.folderId,
      link.name
    );

    // Get folders in the current folder
    const foldersResponse = await drive.files.list({
      q: `'${currentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, parents)",
      orderBy: "name",
    });

    // Get PDF files in the current folder
    const filesResponse = await drive.files.list({
      q: `'${currentFolderId}' in parents and mimeType contains 'pdf' and trashed = false`,
      fields:
        "files(id, name, mimeType, createdTime, size, thumbnailLink, parents)",
      orderBy: "name",
    });

    const folders = foldersResponse.data.files;
    const files = filesResponse.data.files.map((file) => ({
      ...file,
      previewUrl: `/pdf/${file.id}`,
      downloadUrl: `/pdf/${file.id}/download`,
      formattedSize: formatFileSize(file.size),
    }));

    const host = req.get("host");

    const data = {
      folders,
      files,
      folderName,
      breadcrumbs,
      currentFolderId,
      isSharedView: true,
      token,
      isMobile,
      serviceEmail: "biodatalisting@biodatalisting.iam.gserviceaccount.com",
      host,
    };

    // Render the page
    res.render("sharedFolder", data, async (err, html) => {
      if (err) throw err;
      // Save the rendered page with device type
      await pageRenderer.savePage(url, html, isMobile);
      res.send(html);
    });
  } catch (error) {
    console.error("Error viewing shared folder:", error);
    res.status(500).render("error", {
      error: "Failed to load shared folder",
    });
  }
};

// Helper function for shared folder breadcrumbs
async function getSharedBreadcrumbs(
  drive,
  currentFolderId,
  rootFolderId,
  rootName
) {
  const breadcrumbs = [];

  if (currentFolderId === rootFolderId) {
    return [{ id: rootFolderId, name: rootName }];
  }

  let folder = currentFolderId;
  while (folder) {
    try {
      const response = await drive.files.get({
        fileId: folder,
        fields: "id, name, parents",
      });

      breadcrumbs.unshift({ id: response.data.id, name: response.data.name });

      if (!response.data.parents || response.data.parents[0] === rootFolderId) {
        breadcrumbs.unshift({ id: rootFolderId, name: rootName });
        break;
      }

      folder = response.data.parents[0];
    } catch (error) {
      console.error("Error getting folder for breadcrumbs:", error);
      break;
    }
  }

  return breadcrumbs;
}

// Add this new controller function
export const adminShareManager = async (req, res) => {
  try {
    const drive = await getDriveService();

    // Get all folders with more details
    const foldersResponse = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name, createdTime, parents)",
      orderBy: "name",
      pageSize: 1000, // Increase to get all folders
    });

    // Log for debugging
    // console.log("Found folders:", foldersResponse.data.files.length);
    // console.log("First few folders:", foldersResponse.data.files.slice(0, 3));

    // Get folder details including path
    const foldersWithPath = await Promise.all(
      foldersResponse.data.files.map(async (folder) => {
        try {
          const path = await getFolderPath(drive, folder);
          return {
            ...folder,
            fullPath: path.join(" > "),
          };
        } catch (error) {
          console.error(`Error getting path for folder ${folder.name}:`, error);
          return {
            ...folder,
            fullPath: folder.name,
          };
        }
      })
    );

    // Get all share links
    const shareLinks = await ShareLink.getAll();

    // Get additional details for each share link
    const shareLinksWithDetails = await Promise.all(
      shareLinks.map(async (link) => {
        try {
          const folderDetails = await drive.files.get({
            fileId: link.folderId,
            fields: "name, trashed",
          });
          return {
            ...link,
            folderName: folderDetails.data.name,
            isValid: !folderDetails.data.trashed,
          };
        } catch (error) {
          console.error(`Error getting details for share ${link.name}:`, error);
          return {
            ...link,
            folderName: "Unknown or Deleted Folder",
            isValid: false,
          };
        }
      })
    );

    // Sort share links by creation date (newest first)
    shareLinksWithDetails.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Log for debugging
    // console.log("Active share links:", shareLinksWithDetails.length);

    res.render("admin/shareManager", {
      folders: foldersWithPath,
      shareLinks: shareLinksWithDetails.filter((link) => link.isValid), // Only show valid links
      adminKey: process.env.ADMIN_KEY,
      baseUrl: `${req.protocol}://${req.get("host")}`,
      serviceEmail: process.env.SERVICE_EMAIL,
    });
  } catch (error) {
    console.error("Error loading admin page:", error);
    res.status(500).render("error", {
      error: "Failed to load admin page: " + error.message,
    });
  }
};

// Helper function to get folder path
async function getFolderPath(drive, folder) {
  const path = [folder.name];
  let current = folder;

  while (current.parents && current.parents[0] !== "root") {
    try {
      const parent = await drive.files.get({
        fileId: current.parents[0],
        fields: "id, name, parents",
      });
      path.unshift(parent.data.name);
      current = parent.data;
    } catch (error) {
      console.error("Error getting parent folder:", error);
      break;
    }
  }

  return path;
}
