import React from "react";
import { 
  Select, 
  SelectItem, 
  Input,
  Divider,
} from "@heroui/react";
import { REGISTRATION_STATUSES, MASTER_FEE_STATUSES } from "./types/song";
import { SplitsTable, SplitRow } from "../home/splitsTable";

interface SplitInformationStepProps {
  handleCollaboratorToggle: (
    collaboratorId: string,
    splitType: "songwriter" | "publishing" | "master",
    isAdding: boolean
  ) => void;
  registrationStatus: string;
  setRegistrationStatus: (status: string) => void;
  masterFeeStatus: string;
  setMasterFeeStatus: (status: string) => void;
  fee: string | undefined;
  setFee: (fee: string | undefined) => void;
  // New props for splits state management
  splitRows: SplitRow[];
  onSplitRowChange: (index: number, field: string, value: string | number | { id: string; name: string; email: string }) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  splitsTotal: {
    songwriting: number;
    publishing: number;
    master: number;
  };
}

export const SplitInformationStep: React.FC<SplitInformationStepProps> = ({
  handleCollaboratorToggle,
  registrationStatus,
  setRegistrationStatus,
  masterFeeStatus,
  setMasterFeeStatus,
  fee,
  setFee,
  // New props for splits state management
  splitRows,
  onSplitRowChange,
  onAddRow,
  onRemoveRow,
  splitsTotal,
}) => {

  // Handle when a split row changes - need to handle collaborator selection specially
  const handleRowChange = (index: number, field: string, value: string | number | { id: string; name: string; email: string }) => {
    if (field === "collaborator" && typeof value === "object") {
      // Remove old collaborator from all split types if exists
      const oldId = splitRows[index].id;
      if (oldId) {
        handleCollaboratorToggle(oldId, "songwriter", false);
        handleCollaboratorToggle(oldId, "publishing", false);
        handleCollaboratorToggle(oldId, "master", false);
      }
      
      // Add new collaborator to all split types
      if (value.id) {
        handleCollaboratorToggle(value.id, "songwriter", true);
        handleCollaboratorToggle(value.id, "publishing", true);
        handleCollaboratorToggle(value.id, "master", true);
      }
    }
    
    // Use the parent's handler
    onSplitRowChange(index, field, value);
  };

  const handleRemoveRow = (index: number) => {
    const rowToRemove = splitRows[index];
    if (rowToRemove.id) {
      // Remove from all split types
      handleCollaboratorToggle(rowToRemove.id, "songwriter", false);
      handleCollaboratorToggle(rowToRemove.id, "publishing", false);
      handleCollaboratorToggle(rowToRemove.id, "master", false);
    }
    onRemoveRow(index);
  };

  return (
    <div className="space-y-6 w-full">

      {/* Splits Table Section */}
      <div className="space-y-4 w-full">
        <div>
          <h4 className="text-medium font-normal text-default-600">
            Collaborator Splits
          </h4>
        </div>

        <SplitsTable
          splitRows={splitRows}
          onSplitRowChange={handleRowChange}
          onAddRow={onAddRow}
          onRemoveRow={handleRemoveRow}
          totals={splitsTotal}
        />        
      </div>

      <Divider />

      {/* Registration Status Section */}
      <div className="space-y-4">
        
        <Select
          label="Registration Status"
          placeholder="Select registration status"
          selectedKeys={registrationStatus ? [registrationStatus] : []}
          onChange={(e) => setRegistrationStatus(e.target.value)}
          className="w-full"
          classNames={{
            base: "w-full",
            trigger: "w-full"
          }}
        >
          {REGISTRATION_STATUSES.map((status) => (
            <SelectItem key={status}>{status}</SelectItem>
          ))}
        </Select>
      </div>

      <Divider />

      {/* Master Fee Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            label="Master Fee Amount"
            placeholder="Enter fee amount (optional)"
            value={fee}
            onValueChange={setFee}
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">$</span>
              </div>
            }
            type="number"
            min="0"
            step="0.01"
            className="flex-1"
          />
          <Select
            label="Master Fee Status"
            placeholder="Select status (optional)"
            selectedKeys={masterFeeStatus ? [masterFeeStatus] : []}
            onChange={(e) => setMasterFeeStatus(e.target.value)}
            className="flex-1"
          >
            {MASTER_FEE_STATUSES.map((status) => (
              <SelectItem key={status}>{status}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};