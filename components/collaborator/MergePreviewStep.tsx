"use client";

import React from "react";
import {
  CollaboratorRelationships,
  PreviewField,
} from "@/lib/api/collaborators";
import { CollaboratorBasicFields, CollaboratorBasicData } from "./CollaboratorBasicFields";

interface MergePreviewStepProps {
  previewFields: PreviewField[];
  previewRelationships: CollaboratorRelationships | null;
  previewData: CollaboratorBasicData;
  onPreviewDataChange: (field: keyof CollaboratorBasicData, value: string) => void;
}

export const MergePreviewStep: React.FC<MergePreviewStepProps> = ({
  previewFields,
  previewRelationships,
  previewData,
  onPreviewDataChange,
}) => {

  const handleNonConflictingFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Update preview data directly for non-conflicting fields
    const dataKey = name as keyof CollaboratorBasicData;
    if (dataKey) {
      onPreviewDataChange(dataKey, value);
    }
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
        <CollaboratorBasicFields
          data={previewData}
          onChange={handleNonConflictingFieldChange}
          variant="preview"
          preview={{
            previewFields,
            onFieldChange: onPreviewDataChange,
          }}
        />

        {/* Relationships Section */}
        <div className="pt-4 border-t">
          <h4 className="text-small font-medium text-foreground-600 mb-3">Relationships</h4>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Managers
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewRelationships?.managers?.length ? 
                  previewRelationships.managers.map(m => m.artist_name || m.legal_name).join(", ") :
                  "(none)"
                }
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Members
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewRelationships?.members?.length ? 
                  previewRelationships.members.map(m => m.artist_name || m.legal_name).join(", ") :
                  "(none)"
                }
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground pb-1.5">
                Publishing Entities
              </label>
              <div className="w-full min-h-10 px-3 py-2 border border-default-300 bg-default-100 rounded-medium text-small text-default-700">
                {previewRelationships?.publishing_entities?.length ? 
                  previewRelationships.publishing_entities.map(e => e.artist_name || e.legal_name).join(", ") :
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