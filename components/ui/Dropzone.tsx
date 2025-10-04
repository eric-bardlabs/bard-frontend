import { Card, CardContent } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import React, { useRef, useState } from "react";

// Define the props expected by the Dropzone component
interface DropzoneProps {
  onChange: React.Dispatch<React.SetStateAction<File[]>>;
  onFilesDropped: (files: File[]) => void;
  className?: string;
  fileExtension?: string;
  multiple?: boolean;
  footerTextOverride?: React.ReactElement;
}

// Create the Dropzone component receiving props
export function Dropzone({
  onChange,
  onFilesDropped,
  className,
  fileExtension,
  multiple = true,
  footerTextOverride = undefined,
  ...props
}: DropzoneProps) {
  // Initialize state variables using the useState hook
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference to file input element
  const [fileInfo, setFileInfo] = useState<string | null>(null); // Information about the uploaded file
  const [error, setError] = useState<string | null>(null); // Error message state

  // Function to handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    handleFiles(files);
  };

  // Function to handle file input change event
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      handleFiles(files);
    }
  };

  // Function to handle processing of uploaded files
  const handleFiles = (files: FileList) => {
    const uploadedFile = files[0];

    // Don't check file extension
    // if (
    //   !uploadedFile.name.endsWith(".zip") &&
    //   !uploadedFile.name.endsWith(`.pdf`)
    // ) {
    //   setError(`Invalid file type. Expected: .pdf or .zip`);
    //   return;
    // }

    const fileSizeInKB = Math.round(uploadedFile.size / 1024); // Convert to KB

    const fileList = Array.from(files); // .map((file) => URL.createObjectURL(file));
    onFilesDropped(fileList);
    onChange((prevFiles) => [...prevFiles, ...fileList]);

    // Display file information
    setFileInfo(`Uploaded file: ${uploadedFile.name} (${fileSizeInKB} KB)`);
    setError(null); // Reset error state
  };

  // Function to simulate a click on the file input element
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const footerText = footerTextOverride ? (
    <p className="text-muted-foreground font-light text-sm text-center">
      {footerTextOverride}
    </p>
  ) : (
    <p className="text-muted-foreground font-light text-sm text-center">
      Or email the files to{" "}
      <b className="text-slate-400">contracts@bardlabs.co</b>
    </p>
  );

  return (
    <Card
      className={`border-2 border-dashed bg-muted hover:cursor-pointer hover:border-muted-foreground/50 ${className} transition-all`}
      {...props}
    >
      <CardContent
        className="flex flex-col h-full items-center justify-center space-y-2 px-2 py-4 text-xs"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className="flex  gap-4 items-center h-full justify-center flex-col text-muted-foreground">
          <FileUp size={40} />
          <span className="text-xl">Drag files to upload or Click here</span>
          {/* <span className="text-lg">
            Supported file types: <b>.pdf</b> or <b>.zip</b>
          </span> */}
          <input
            ref={fileInputRef}
            type="file"
            // accept={`.pdf,.zip`} // Set accepted file type
            accept={`${fileExtension}`}
            onChange={handleFileInputChange}
            className="hidden"
            multiple={multiple}
          />
        </div>
        {footerText}
        {error && <span className="text-red-500">{error}</span>}
      </CardContent>
    </Card>
  );
}
