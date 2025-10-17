"use client";

import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Collaborator,
  PreviewField,
} from "@/lib/api/collaborators";

interface MergePreviewStepProps {
  previewFields: PreviewField[];
  previewCollaborator: Collaborator | null;
  resolvedConflicts: Record<string, string>;
  onConflictResolution: (fieldName: string, value: string) => void;
  onFieldChange: (fieldName: string, value: string) => void;
}

export const MergePreviewStep: React.FC<MergePreviewStepProps> = ({
  previewFields,
  previewCollaborator,
  resolvedConflicts,
  onConflictResolution,
  onFieldChange,
}) => {
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  // Reset local state when preview fields change
  useEffect(() => {
    setCustomValues({});
    setShowCustomInput({});
  }, [previewFields]);

  const handleConflictResolution = (fieldName: string, value: string) => {
    onConflictResolution(fieldName, value);
    
    // If selecting "custom", show custom input
    if (value === "CUSTOM") {
      setShowCustomInput((prev) => ({
        ...prev,
        [fieldName]: true,
      }));
    } else {
      setShowCustomInput((prev) => ({
        ...prev,
        [fieldName]: false,
      }));
    }
  };

  const handleCustomValueChange = (fieldName: string, value: string) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Notify parent of the change
    onFieldChange(fieldName, value);
  };

  const handleNonConflictingFieldChange = (fieldName: string, value: string) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Notify parent of the change
    onFieldChange(fieldName, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-medium font-semibold mb-2">Preview Merged Collaborator</h3>
        <p className="text-small text-default-500 mb-4">
          Review the merged collaborator details. For conflicting fields, choose which value to keep:
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Information Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewFields.map((field) => (
            <div key={field.field_name}>
              {field.has_conflict ? (
                // Conflicting field - show selector with custom option
                <div className="space-y-2">
                  <Select
                    size="sm"
                    label={field.field_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    selectedKeys={[showCustomInput[field.field_name] ? "CUSTOM" : (resolvedConflicts[field.field_name] || "")]}
                    onSelectionChange={(keys) => {
                      const selectedValue = Array.from(keys)[0] as string;
                      handleConflictResolution(field.field_name, selectedValue);
                    }}
                    variant="bordered"
                    labelPlacement="outside"
                  >
                    <>
                      {field.values.map((value) => (
                        <SelectItem 
                          key={value.value || ""} 
                          textValue={`${value.source_name}: ${value.value || "(empty)"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-small">{value.source_name}:</span>
                            <span className="text-default-600 text-small">
                              {value.value || "(empty)"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem key="CUSTOM" textValue="Enter other value">
                        <span className="text-primary font-medium text-small">Enter other value</span>
                      </SelectItem>
                    </>
                  </Select>
                  
                  {showCustomInput[field.field_name] && (
                    <Input
                      size="sm"
                      placeholder="Enter custom value"
                      value={customValues[field.field_name] || ""}
                      onChange={(e) => handleCustomValueChange(field.field_name, e.target.value)}
                      variant="bordered"
                    />
                  )}
                  
                  <p className="text-xs text-warning">⚠️ Conflict detected</p>
                </div>
              ) : (
                // Non-conflicting field - show as editable input
                <Input
                  size="sm"
                  label={field.field_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  value={customValues[field.field_name] !== undefined ? 
                    customValues[field.field_name] : 
                    (field.values.find(v => v.value)?.value || "")
                  }
                  onChange={(e) => handleNonConflictingFieldChange(field.field_name, e.target.value)}
                  variant="bordered"
                  labelPlacement="outside"
                />
              )}
            </div>
          ))}
        </div>

        {/* Relationships Section */}
        <div className="pt-4 border-t">
          <h4 className="text-small font-medium text-foreground-600 mb-3">Relationships</h4>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Managers
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewCollaborator?.relationships?.managers?.length ? 
                  previewCollaborator.relationships.managers.map(m => m.artist_name || m.legal_name).join(", ") :
                  "(none)"
                }
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Members
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewCollaborator?.relationships?.members?.length ? 
                  previewCollaborator.relationships.members.map(m => m.artist_name || m.legal_name).join(", ") :
                  "(none)"
                }
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Publishing Entities
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewCollaborator?.relationships?.publishing_entities?.length ? 
                  previewCollaborator.relationships.publishing_entities.map(e => e.artist_name || e.legal_name).join(", ") :
                  "(none)"
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};