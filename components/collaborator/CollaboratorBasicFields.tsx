import React from "react";
import { Input, Textarea } from "@heroui/react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export interface CollaboratorBasicData {
  legalName: string;
  artistName: string;
  email: string;
  region: string;
  pro: string;
  proId: string;
  profileLink: string;
  bio: string;
  phoneNumber: string;
}

interface CollaboratorBasicFieldsProps {
  data: CollaboratorBasicData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  phoneNumber?: string;
  onPhoneChange: (phone: string | undefined) => void;
}

export const CollaboratorBasicFields: React.FC<CollaboratorBasicFieldsProps> = ({
  data,
  onChange,
  phoneNumber,
  onPhoneChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Row 1 - Names */}
      <div className="flex gap-3">
        <Input
          label="Artist Name"
          name="artistName"
          placeholder="Stage name or artist name"
          value={data.artistName}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
        <Input
          label="Legal Name"
          name="legalName"
          placeholder="Legal or business name"
          value={data.legalName}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
      </div>

      {/* Row 2 - Contact */}
      <div className="flex gap-3">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={data.email}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground pb-1.5">
            Phone Number
          </label>
          <PhoneInput
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={onPhoneChange}
            defaultCountry="US"
            className="w-full"
            inputComponent={Input}
            inputProps={{
              variant: "bordered",
              labelPlacement: "outside"
            }}
          />
        </div>
      </div>

      {/* Row 3 - PRO */}
      <div className="flex gap-3">
        <Input
          label="PRO"
          name="pro"
          placeholder="ASCAP, BMI, SESAC, etc."
          value={data.pro}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
        <Input
          label="PRO ID"
          name="proId"
          placeholder="PRO member ID"
          value={data.proId}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
      </div>

      {/* Row 4 - Location & Link */}
      <div className="flex gap-3">
        <Input
          label="Region"
          name="region"
          placeholder="City, State/Country"
          value={data.region}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
        <Input
          label="Profile Link"
          name="profileLink"
          placeholder="Website or social media URL"
          value={data.profileLink}
          onChange={onChange}
          variant="bordered"
          labelPlacement="outside"
          className="flex-1"
        />
      </div>

      {/* Row 5 - Bio */}
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
  );
};