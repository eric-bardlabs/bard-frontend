"use client";

import React, { useState, useEffect } from "react";
import {
  CollaboratorRelationships,
  PreviewField,
} from "@/lib/api/collaborators";
import { CollaboratorBasicFields, CollaboratorBasicData } from "./CollaboratorBasicFields";
import { CollaboratorMultiSelect } from "./collaboratorMultiSelect";
import { CollaboratorSelection } from "./types";
import { PreviewRelationships } from "./MergeCollaboratorsModal";

interface MergePreviewStepProps {
  previewFields: PreviewField[];
  previewRelationships: PreviewRelationships | null;
  previewData: CollaboratorBasicData;
  onPreviewDataChange: (field: keyof CollaboratorBasicData, value: string) => void;
  onRelationshipsChange: (relationships: PreviewRelationships) => void;
}

export const MergePreviewStep: React.FC<MergePreviewStepProps> = ({
  previewFields,
  previewRelationships,
  previewData,
  onPreviewDataChange,
  onRelationshipsChange,
}) => {
  const [selectedManagers, setSelectedManagers] = useState<CollaboratorSelection[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<CollaboratorSelection[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<CollaboratorSelection[]>([]);

  // Initialize relationship selections from previewRelationships only once
  useEffect(() => {
    if (previewRelationships) {
      setSelectedManagers(previewRelationships.managers);
      setSelectedMembers(previewRelationships.members);
      setSelectedEntities(previewRelationships.publishing_entities);
    }
  }, [previewRelationships]);

  // Create handlers that update both local state and parent
  const handleManagersChange = (managers: CollaboratorSelection[]) => {
    setSelectedManagers(managers);
    const newRelationships: PreviewRelationships = {
      managers: managers, 
      members: selectedMembers,
      publishing_entities: selectedEntities,
    };
    onRelationshipsChange(newRelationships);
  };

  const handleMembersChange = (members: CollaboratorSelection[]) => {
    setSelectedMembers(members);
    const newRelationships: PreviewRelationships = {
      managers: selectedManagers,
      members: members,
      publishing_entities: selectedEntities,
    };
    onRelationshipsChange(newRelationships);
  };

  const handleEntitiesChange = (entities: CollaboratorSelection[]) => {
    setSelectedEntities(entities);
    const newRelationships: PreviewRelationships = {
      managers: selectedManagers,
      members: selectedMembers,
      publishing_entities: entities,
    };
    onRelationshipsChange(newRelationships);
  };

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
          <h4 className="text-md font-medium text-foreground-600 mb-3">Relationships</h4>
          
          <div className="space-y-3">
            <div>
              <CollaboratorMultiSelect
                defaultSelected={selectedManagers}
                setSelected={handleManagersChange}
                title="Managers"
              />
              <p className="text-xs text-default-500 mt-1">
                Select people/entities who manage this collaborator
              </p>
            </div>

            <div>
              <CollaboratorMultiSelect
                defaultSelected={selectedMembers}
                setSelected={handleMembersChange}
                title="Members"
              />
              <p className="text-xs text-default-500 mt-1">
                Select people who this collaborator manages
              </p>
            </div>

            <div>
              <CollaboratorMultiSelect
                defaultSelected={selectedEntities}
                setSelected={handleEntitiesChange}
                title="Publishing Entities"
              />
              <p className="text-xs text-default-500 mt-1">
                Select publishing companies/entities associated with this collaborator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};