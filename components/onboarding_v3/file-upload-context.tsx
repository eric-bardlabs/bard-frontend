import React from "react";

export type FileStatus = "idle" | "uploading" | "processing" | "success" | "error";

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: FileStatus;
  message?: string;
  createdAt: Date;
}

interface FileUploadContextType {
  uploads: FileUpload[];
  addFile: (file: File) => string | undefined;
  finishUpload: (id: string) => void;
  errorUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

const FileUploadContext = React.createContext<FileUploadContextType | undefined>(undefined);

export const FileUploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = React.useState<FileUpload[]>([]);

  const addFile = (file: File) => {
    // Check if there's already an upload in progress
    const hasActiveUpload = uploads.some(
      upload => upload.status === "uploading" || upload.status === "processing"
    );
    
    if (hasActiveUpload) {
      console.warn("Upload in progress. Please wait until it completes.");
      return;
    }
    
    // No need to check array length since we're passing a single file
    const upload: FileUpload = {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "idle",
      createdAt: new Date(),
    };
    // Clear any completed uploads before adding the new one
    setUploads(prevUploads => 
      prevUploads
        .filter(u => u.status !== "success" && u.status !== "error")
        .concat(upload)
    );
    
    // Process the file
    setUploads((prevUploads) =>
      prevUploads.map((u) =>
        u.id === upload.id ? { ...u, status: "processing" as const } : u
      )
    );
    return upload.id;
  };

  const finishUpload = (uploadId: string) => {
          setUploads((prevUploads) =>
        prevUploads.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                status: "success" as const,
                progress: 100,
                message: "CSV processed successfully",
              }
            : u
        )
      );
  };

  const errorUpload = (uploadId: string) => {
    setUploads((prevUploads) =>
      prevUploads.map((u) =>
        u.id === uploadId
          ? {
              ...u,
              status: "error" as const,
              message: "CSV processing failed, please try again later",
            }
          : u
      )
    );
  };

  const removeUpload = (id: string) => {
    setUploads((prevUploads) => prevUploads.filter((upload) => upload.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prevUploads) =>
      prevUploads.filter((upload) => upload.status !== "success" && upload.status !== "error")
    );
  };

  return (
    <FileUploadContext.Provider value={{ uploads, addFile, finishUpload, errorUpload, removeUpload, clearCompleted }}>
      {children}
    </FileUploadContext.Provider>
  );
};

export const useFileUpload = () => {
  const context = React.useContext(FileUploadContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploadProvider");
  }
  return context;
};