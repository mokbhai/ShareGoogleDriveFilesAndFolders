import { getDriveService } from "../config/googleDrive.js";
import { ShareLink } from "../models/shareLink.js";
import { formatFileSize } from "./driveController.js";

export const getSharedFolderMobile = async (req, res) => {
  try {
    // Set CORS headers explicitly
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    const { token } = req.params;
    const { folderId } = req.query;
    const link = await ShareLink.getByToken(token);

    if (!link) {
      return res.status(404).json({
        error: "Share link not found",
      });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({
        error: "This share link has expired",
      });
    }

    const drive = await getDriveService();
    const currentFolderId = folderId || link.folderId;

    // Get current folder details
    let currentFolder;
    try {
      currentFolder = await drive.files.get({
        fileId: currentFolderId,
        fields: "id, name, parents",
      });
      currentFolder = currentFolder.data;
    } catch (error) {
      console.error("Error getting folder details:", error);
      return res.status(404).json({
        error: "Folder not found",
      });
    }

    // Build breadcrumbs
    const breadcrumbs = [];
    let current = currentFolder;

    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
      });

      if (!current.parents || current.id === link.folderId) break;

      try {
        const parent = await drive.files.get({
          fileId: current.parents[0],
          fields: "id, name, parents",
        });
        current = parent.data;
      } catch (error) {
        console.error("Error getting parent folder:", error);
        break;
      }
    }

    // Get folders
    const foldersResponse = await drive.files.list({
      q: `'${currentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, createdTime, mimeType)",
      orderBy: "name",
    });

    // Get PDF files
    const filesResponse = await drive.files.list({
      q: `'${currentFolderId}' in parents and mimeType contains 'pdf' and trashed = false`,
      fields: "files(id, name, createdTime, mimeType, size)",
      orderBy: "name",
    });

    // Format response
    const response = {
      folders: foldersResponse.data.files,
      files: filesResponse.data.files.map((file) => ({
        ...file,
        previewUrl: `/pdf/${file.id}`,
        downloadUrl: `/pdf/${file.id}/download`,
        formattedSize: formatFileSize(file.size),
      })),
      breadcrumbs,
      folderName: currentFolder.name,
      currentFolder: {
        id: currentFolder.id,
        name: currentFolder.name,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in mobile API:", error);
    res.status(500).json({
      error: "Failed to load shared folder",
    });
  }
};

export const servePdf = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { preview } = req.query;
    const drive = await getDriveService();

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "mimeType, name",
    });

    // Get the file content
    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "stream" }
    );

    // Set appropriate headers
    res.setHeader("Content-Type", "application/pdf");

    if (preview) {
      // For preview, set inline disposition
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileMetadata.data.name}"`
      );
    } else {
      // For download, set attachment disposition
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileMetadata.data.name}"`
      );
    }

    // Stream the file
    response.data.pipe(res);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ error: "Error serving PDF file" });
  }
};
