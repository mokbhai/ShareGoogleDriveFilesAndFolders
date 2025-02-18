export interface Folder {
  id: string;
  name: string;
  createdTime: string;
  mimeType: string;
}

export interface File {
  id: string;
  name: string;
  createdTime: string;
  mimeType: string;
  size: number;
  formattedSize: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface SharedFolderData {
  folders: Folder[];
  files: File[];
  breadcrumbs: Breadcrumb[];
  folderName: string;
  currentFolder?: {
    id: string;
    name: string;
  };
}

export interface ApiResponse {
  data: SharedFolderData;
  error?: string;
}
