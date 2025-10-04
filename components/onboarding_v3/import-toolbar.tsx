import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ImportToolbarProps {
  importType: "identity" | "collaborators" | "songs" | "splits";
  onImport: (source: "spotify" | "calendar" | "csv") => void;
  className?: string;
}

export const ImportToolbar: React.FC<ImportToolbarProps> = ({ onImport, importType, className = "" }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Process CSV file
      onImport("csv");
    }
  };
  
  const getImportTitle = () => {
    switch (importType) {
      case "identity": return "Import Artist Information";
      case "collaborators": return "Import Collaborators";
      case "songs": return "Import Songs";
      case "splits": return "Import Splits";
      default: return "Import Data";
    }
  };

  return (
    <div className={`w-full bg-default-50 border-b border-divider py-3 px-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <Icon icon="lucide:download" className="text-default-500" />
        <span className="text-sm font-medium">{getImportTitle()}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          size="sm"
          variant="flat" 
          color="primary"
          startContent={<Icon icon="logos:spotify-icon" />}
          onPress={() => onImport("spotify")}
        >
          Spotify
        </Button>
        
        <Button 
          size="sm"
          variant="flat" 
          startContent={<Icon icon="lucide:calendar" />}
          onPress={() => onImport("calendar")}
        >
          Calendar
        </Button>
        
        <Button 
          size="sm"
          variant="flat" 
          startContent={<Icon icon="lucide:file" />}
          onPress={() => fileInputRef.current?.click()}
        >
          CSV
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};