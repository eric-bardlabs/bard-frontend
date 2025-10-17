import React, { useState } from "react";
import { Input, Textarea, Select, SelectItem } from "@heroui/react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { PreviewField } from "@/lib/api/collaborators";

export interface CollaboratorBasicData {
  legal_name?: string;
  artist_name?: string;
  email?: string;
  region?: string;
  pro?: string;
  pro_id?: string;
  profile_link?: string;
  bio?: string;
  phone_number?: string;
  initial_source?: string;
}

interface PreviewProps {
  previewFields: PreviewField[];
  onFieldChange: (fieldName: keyof CollaboratorBasicData, value: string) => void;
}

interface CollaboratorBasicFieldsProps {
  data: CollaboratorBasicData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  variant?: "default" | "preview";
  preview?: PreviewProps;
}

export const CollaboratorBasicFields: React.FC<CollaboratorBasicFieldsProps> = ({
  data,
  onChange,
  variant = "default",
  preview,
}) => {
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});
  // Helper function to render field based on variant
  const renderField = (
    fieldName: keyof CollaboratorBasicData, 
    label: string, 
    placeholder: string, 
    type: string = "text",
    className: string = "flex-1"
  ) => {

    const previewField = preview && preview.previewFields.find(f => f.field_name === fieldName);
    if (variant === "preview" && preview && previewField?.has_conflict) {
        return (
          <div className={`${className} space-y-2`}>
            <Select
              label={label}
              selectedKeys={[showCustomInput[fieldName] ? "CUSTOM" : (data[fieldName] || "")]}
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0] as string;
                // Handle the conflict resolution locally
                if (selectedValue === "CUSTOM") {
                  setShowCustomInput((prev) => ({
                    ...prev,
                    [fieldName]: true,
                  }));
                } else {
                  // Update preview data and hide custom input
                  preview.onFieldChange(fieldName as keyof CollaboratorBasicData, selectedValue);
                  setShowCustomInput((prev) => ({
                    ...prev,
                    [fieldName]: false,
                  }));
                }
              }}
              variant="bordered"
              labelPlacement="outside"
              className="w-full"
              classNames={{
                trigger: "min-h-12",
                value: "text-small",
                label: "text-sm font-medium text-foreground pb-1.5"
              }}
            >
              <>
                {previewField.values.map((value) => (
                  <SelectItem 
                    key={value || ""} 
                    textValue={value || "-"}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-medium text-small">
                        {value || "-"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem key="CUSTOM" textValue="Other">
                  <span className="text-default-600 text-small">Other</span>
                </SelectItem>
              </>
            </Select>
            
            {showCustomInput[fieldName] && (
              fieldName === "phone_number" ? (
                <div className="w-full">
                  <label className="text-sm font-medium text-foreground pb-1.5 block">Enter {label}</label>
                  <PhoneInput
                    placeholder={`Enter ${label}...`}
                    value={data[fieldName] || ""}
                    onChange={(value) => preview.onFieldChange(fieldName as keyof CollaboratorBasicData, value || "")}
                    className="w-full"
                    defaultCountry="US"
                    inputComponent={Input}
                    inputProps={{
                      variant: "bordered",
                      labelPlacement: "outside"
                    }}
                  />
                </div>
              ) : (
                <Input
                  placeholder={`Enter ${label}...`}
                  label={`Enter ${label}`}
                  value={data[fieldName] || ""}
                  onChange={(e) => preview.onFieldChange(fieldName as keyof CollaboratorBasicData, e.target.value)}
                  variant="bordered"
                  className="w-full"
                />
              )
            )}
            
            <p className="text-xs text-warning">⚠️ Conflict detected</p>
          </div>
        );
    } else {
      // Default field - regular input or PhoneInput for phone_number
      if (fieldName === "phone_number") {
        return (
          <div className={className}>
            <label className="text-sm font-medium text-foreground pb-1.5 block">{label}</label>
            <PhoneInput
              placeholder={placeholder}
              value={data[fieldName] || ""}
              onChange={(value) => {
                // Create a synthetic event for compatibility
                const syntheticEvent = {
                  target: {
                    name: fieldName,
                    value: value || ""
                  }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
              }}
              className="w-full"
              defaultCountry="US"
              inputComponent={Input}
              inputProps={{
                variant: "bordered",
                labelPlacement: "outside"
              }}
            />
          </div>
        );
      } else {
        return (
          <Input
            label={label}
            name={fieldName}
            type={type}
            placeholder={placeholder}
            value={data[fieldName]}
            onChange={onChange}
            variant="bordered"
            labelPlacement="outside"
            className={className}
          />
        );
      }
    }
  };
  return (
    <div className="space-y-4">
      {/* Row 1 - Names */}
      <div className="flex gap-3">
        {renderField("artist_name", "Artist Name", "Stage name or artist name")}
        {renderField("legal_name", "Legal Name", "Legal or business name")}
      </div>

      {/* Row 2 - Contact */}
      <div className="flex gap-3">
        {renderField("email", "Email", "email@example.com", "email")}
        {renderField("phone_number", "Phone Number", "Enter phone number")}
      </div>

      {/* Row 3 - PRO */}
      <div className="flex gap-3">
        {renderField("pro", "PRO", "ASCAP, BMI, SESAC, etc.")}
        {renderField("pro_id", "PRO ID", "PRO member ID")}
      </div>

      {/* Row 4 - Location & Link */}
      <div className="flex gap-3">
        {renderField("region", "Region", "City, State/Country")}
        {renderField("profile_link", "Profile Link", "Website or social media URL")}
      </div>

      {/* Row 5 - Bio */}
      <div className="flex gap-3">
        <Textarea
          label="Bio"
          name="bio"
          placeholder="Brief description or notes about this collaborator..."
          value={data.bio}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          minRows={3}
          className="w-full"
        />
      </div>
    </div>
  );
};