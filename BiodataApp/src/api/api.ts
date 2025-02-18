import axios from "axios";
import { SharedFolderData } from "../types";

const BASE_URL = "https://backend.impressment.in";

export const api = {
  getSharedFolder: async (
    token: string,
    folderId?: string
  ): Promise<SharedFolderData> => {
    try {
      const url = folderId
        ? `${BASE_URL}/api/share/${token}?folderId=${folderId}`
        : `${BASE_URL}/api/share/${token}`;

      //   console.log("Fetching URL:", url); // Debug log

      const response = await axios.get<SharedFolderData>(url);

      //   console.log("API Response:", response.data); // Debug log

      // Transform the response if needed
      const transformedData: SharedFolderData = {
        folders: response.data.folders || [],
        files: response.data.files || [],
        breadcrumbs: response.data.breadcrumbs || [],
        folderName: response.data.folderName || "Shared Folder",
        currentFolder: response.data.currentFolder,
      };

      return transformedData;
    } catch (error) {
      console.error("Error fetching shared folder:", error, token);
      throw error;
    }
  },

  downloadPdf: async (fileId: string): Promise<Blob> => {
    try {
      const response = await axios.get<Blob>(
        `${BASE_URL}/api/pdf/${fileId}?preview=true`,
        {
          responseType: "blob",
          headers: {
            Accept: "application/pdf",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  },
};
