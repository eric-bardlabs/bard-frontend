import React from "react";
import { Button, Card, Divider, RadioGroup, Radio } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useFileUpload } from "./file-upload-context";
import { createClient } from "@/api_clients/supabase/component";
import { useAuth } from "@clerk/nextjs";
import { OnboardingFormData } from "@/components/types/onboarding";

// Add props for data and onUpdate
interface FileUploaderProps {
  onboardingData: OnboardingFormData;
  saveOnboardingData: (data: OnboardingFormData) => void;
  onPendingStateChange?: (pending: boolean) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onboardingData,
  saveOnboardingData,
  onPendingStateChange,
}) => {
  const { getToken } = useAuth();

  const { addFile, finishUpload, errorUpload, uploads } = useFileUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFileType, setSelectedFileType] = React.useState<string>("");
  const [fileTypeError, setFileTypeError] = React.useState<string>("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL;

  // Notify parent of pending state changes
  React.useEffect(() => {
    const hasPendingUploads = uploads.some(
      (upload) =>
        upload.status === "uploading" || upload.status === "processing"
    );
    const isPending = hasPendingUploads || isUploading;
    onPendingStateChange?.(isPending);
  }, [uploads, isUploading, onPendingStateChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Validate file type selection
      if (!selectedFileType) {
        setFileTypeError("Please select a file type before uploading");
        return;
      }

      setFileTypeError(""); // Clear any previous errors

      const file = e.target.files[0];
      const uploadId = addFile(file);
      setIsUploading(true);
      try {
        // First upload to Supabase storage
        const { fileName } = await uploadFileToStorage(file);

        // Store file information in form data
        saveOnboardingData({
          ...onboardingData,
          uploadedFiles: [...onboardingData.uploadedFiles, fileName],
        });

        // Then upload to backend as before
        const response = await uploadFileToBackend(file);

        if (uploadId) {
          finishUpload(uploadId);
        }
      } catch (error) {
        console.error("Upload error:", error);
        if (uploadId) {
          errorUpload(uploadId);
        }
      } finally {
        setIsUploading(false);
        setSelectedFileType("");
        // Clear the file input so the same file can be selected again
        clearFileInput();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Check if multiple files were dropped
      if (e.dataTransfer.files.length > 1) {
        // Show error or notification that only one file is allowed
        console.warn("Only one file can be uploaded at a time");
        return;
      }

      // Validate file type selection
      if (!selectedFileType) {
        setFileTypeError("Please select a file type before uploading");
        return;
      }

      setFileTypeError(""); // Clear any previous errors

      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv") {
        const uploadId = addFile(file);
        setIsUploading(true);
        try {
          // First upload to Supabase storage
          const { fileName } = await uploadFileToStorage(file);

          // Store file information in form data
          saveOnboardingData({
            ...onboardingData,
            uploadedFiles: [...onboardingData.uploadedFiles, fileName],
          });

          // Then upload to backend as before
          const response = await uploadFileToBackend(file);
          // Merge response into data and call onUpdate
          if (uploadId) {
            finishUpload(uploadId);
          }
        } catch (error) {
          console.error("Upload error:", error);
          if (uploadId) {
            errorUpload(uploadId);
          }
        } finally {
          setIsUploading(false);
          setSelectedFileType("");
          // Clear the file input so the same file can be selected again
          clearFileInput();
        }
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = await getToken({ template: "bard-backend" });

    const response = await fetch(`${API_BASE_URL}/onboarding/extract-csv?type=${selectedFileType}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Do NOT set Content-Type header; browser will set it with boundary
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    // Optionally handle response
    const data = await response.json();
    return data;
  };

  // Function to upload file to Supabase storage
  const uploadFileToStorage = async (
    file: File
  ): Promise<{ fileName: string }> => {
    const supabase = createClient();

    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileExtension = file.name.split(".").pop();
    const fileName = `files/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from("user-onboarding-csv")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading to Supabase storage:", error);
      throw new Error(`Failed to upload file to storage: ${error.message}`);
    }

    // Get the public URL

    return {
      fileName: fileName,
    };
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Upload CSV Files</h2>
      <p className="text-default-500 text-sm mb-4">
        Upload a CSV spreadsheet for us to extract song, collaborator, and
        splits metadata. You can also download a CSV from your PRO, the MLC, or
        request them from your label or publisher.
      </p>
      <p className="text-default-500 text-sm mb-4">
        If you don't have a spreadsheet, here is an{" "}
        <a
          href="https://aeslquagrnbfuuztoayk.supabase.co/storage/v1/object/public/template_files/Bard%20-%20Import%20template%20-%20Songs_csv.csv"
          download
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          example template
        </a>{" "}
        of what we can extract from. Your spreadsheet doesn't have to be exactly
        the same, but the more structured and clear the headers and values in
        the CSV are, the higher our extraction accuracy will be.
      </p>
      <Divider className="my-4" />

      {/* File Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-default-700 mb-2">
          What type of file are you uploading?{" "}
          <span className="text-danger">*</span>
        </label>
        <RadioGroup
          label="Select file type"
          value={selectedFileType}
          onValueChange={setSelectedFileType}
          isRequired
          errorMessage={fileTypeError}
        >
          <Radio value="ASCAP" description="Upload a CSV export from ASCAP">
            <div className="flex items-center gap-2">
              <span>ASCAP Export</span>
            </div>
          </Radio>
          <Radio value="BMI" description="Upload a CSV export from BMI">
            <div className="flex items-center gap-2">
              <span>BMI Export</span>
            </div>
          </Radio>
          <Radio
            value="CUSTOM"
            description="Upload your own custom formatted spreadsheet"
          >
            <div className="flex items-center gap-2">
              <span>Custom spreadsheet (CSV)</span>
            </div>
          </Radio>
        </RadioGroup>

        <p className="text-xs text-default-500 mt-2">
          This helps us optimize the extraction process for your specific file
          format.
        </p>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 
          flex flex-col items-center justify-center
          transition-colors duration-200
          ${isDragging ? "border-primary bg-primary-50" : "border-default-300"}
          ${!selectedFileType || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={!selectedFileType ? undefined : handleBrowseClick}
      >
        <Icon
          icon="lucide:file-csv"
          className={`text-5xl mb-4 ${isDragging ? "text-primary" : selectedFileType ? "text-default-400" : "text-default-300"}`}
        />
        <p className="text-center mb-2">
          <span className="font-medium">
            {!selectedFileType
              ? "Please select a file type first"
              : "Drag and drop CSV files here"}
          </span>
        </p>
        <p className="text-center text-default-500 text-sm mb-4">
          {!selectedFileType
            ? "Select file type above to enable upload"
            : "or click the button below to browse"}
        </p>
        <Button
          color="primary"
          variant="flat"
          onPress={handleBrowseClick}
          startContent={<Icon icon="lucide:upload" />}
          isDisabled={!selectedFileType || isUploading}
        >
          Browse Files
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          multiple={false}
          className="hidden"
        />
      </div>
    </Card>
  );
};
