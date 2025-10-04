import React from "react";
import { Button, Card, Chip, Divider, Progress, Tooltip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FileUpload, useFileUpload } from "./file-upload-context";

export const UploadHistory: React.FC = () => {
  const { uploads, removeUpload, clearCompleted } = useFileUpload();
  
  if (uploads.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  };

  // Simplified status color function
  const getStatusColor = (status: FileUpload["status"]) => {
    switch (status) {
      case "processing":
        return "primary";
      case "success":
        return "success";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  // Simplified status icon function
  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "processing":
        return "lucide:loader";
      case "success":
        return "lucide:check-circle";
      case "error":
        return "lucide:alert-circle";
      default:
        return "lucide:file";
    }
  };

  const hasCompleted = uploads.some(upload => 
    upload.status === "success" || upload.status === "error"
  );

  // Define processing steps for visualization
  const processingSteps = [
    { key: "uploading", label: "Uploading File", icon: "lucide:upload-cloud" },
    { key: "validating", label: "Validating Format", icon: "lucide:check-square" },
    { key: "processing", label: "Processing Data", icon: "lucide:database" },
    { key: "completing", label: "Finalizing", icon: "lucide:check-circle" }
  ];
  
  // Function to determine current step based on progress
  const getCurrentStep = (progress: number): number => {
    if (progress < 40) return 0; // Uploading
    if (progress < 70) return 1; // Validating
    if (progress < 90) return 2; // Processing
    return 3; // Completing
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Upload Status</h2>
        {hasCompleted && (
          <Button 
            size="sm" 
            color="default" 
            variant="light"
            onPress={clearCompleted}
            isIconOnly
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        )}
      </div>
      <Divider className="my-2" />
      
      <div className="space-y-4">
        {uploads.map((upload) => (
          <div key={upload.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-default-100 rounded-medium">
                  <Icon icon="lucide:file-csv" className="text-lg text-default-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{upload.file.name}</p>
                  <p className="text-xs text-default-500">
                    {formatFileSize(upload.file.size)} • {formatDate(upload.createdAt)}
                  </p>
                </div>
              </div>
              
              <Tooltip content="Remove">
                <Button
                  size="sm"
                  variant="light"
                  color="default"
                  onPress={() => removeUpload(upload.id)}
                  isIconOnly
                >
                  <Icon icon="lucide:trash-2" />
                </Button>
              </Tooltip>
            </div>
            
            {/* Simplified status display */}
            <div className="flex items-center gap-3 py-3">
              {upload.status === "processing" ? (
                <div className="flex-1 flex items-center justify-center py-4">
                  <div className="flex flex-col items-center">
                    <Spinner color="primary" className="mb-3" />
                    <p className="text-sm font-medium">We are extracting the data from your CSV file...</p>
                    <p className="text-xs text-default-500 mt-1">This may take up to a few minutes</p>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center gap-2 ${
                  upload.status === "error" ? "text-danger" : "text-success"
                }`}>
                  <Icon 
                    icon={getStatusIcon(upload.status)} 
                    className="text-xl" 
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {upload.status === "success" ? "File Processed Successfully.  Click next to review your catalog" : "Error Processing File, please try again later"}
                    </p>
                    {upload.message && (
                      <p className="text-xs">{upload.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <Divider className="mt-1" />
          </div>
        ))}
      </div>
    </Card>
  );
};