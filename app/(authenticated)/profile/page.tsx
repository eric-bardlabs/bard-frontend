"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Avatar,
  Spinner,
  Tooltip,
} from "@heroui/react";

import { fetchMyCollaboratorProfile, updateCollaborator, type Collaborator } from "@/lib/api/collaborators";

interface ProfileFieldProps {
  label: string;
  field: keyof Collaborator;
  value?: string;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  isEditing: boolean;
  editFormData: Partial<Collaborator>;
  onInputChange: (field: keyof Collaborator, value: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
}

const ProfileField = ({ 
  label, 
  field, 
  value, 
  type = "text",
  placeholder,
  multiline = false,
  isEditing,
  editFormData,
  onInputChange,
  disabled = false,
  disabledMessage
}: ProfileFieldProps) => {
  const displayValue = value || "Not set";
  
  return (
    <div className="space-y-2">
      <label className="text-small font-medium text-default-500">
        {label}
      </label>
      {isEditing && !disabled ? (
        multiline ? (
          <Textarea
            value={editFormData[field] as string || ""}
            onChange={(e) => onInputChange(field, e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px]"
          />
        ) : (
          <Input
            type={type}
            value={editFormData[field] as string || ""}
            onChange={(e) => onInputChange(field, e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <div className={`p-2 ${!value ? "text-default-400 italic" : ""}`}>
          {disabled && disabledMessage && isEditing ? (
            <Tooltip content={disabledMessage}>
              <div className="cursor-help">
                {displayValue}
              </div>
            </Tooltip>
          ) : (
            displayValue
          )}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Collaborator>>({});

  const { data: profile, isLoading, error } = useQuery<Collaborator | null>({
    queryKey: ["myCollaboratorProfile"],
    queryFn: async () => {
      const token = await getToken( { template: "bard-backend" } );
      if (!token) throw new Error("No authentication token");
      return fetchMyCollaboratorProfile({ token });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Collaborator>) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No authentication token");
      if (!profile?.id) throw new Error("No profile ID");
      
      return updateCollaborator({
        token,
        id: profile.id,
        updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCollaboratorProfile"] });
      setIsEditing(false);
      setEditFormData({});
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    },
  });

  const handleEdit = () => {
    if (profile) {
      setEditFormData({
        legal_name: profile.legal_name || "",
        artist_name: profile.artist_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        region: profile.region || "",
        pro: profile.pro || "",
        pro_id: profile.pro_id || "",
        profile_link: profile.profile_link || "",
        bio: profile.bio || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const updates = Object.fromEntries(
      Object.entries(editFormData).filter(([_, value]) => value !== undefined)
    );
    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleInputChange = (field: keyof Collaborator, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-2 text-small text-default-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <Icon icon="solar:warning-bold" className="h-12 w-12 text-danger mb-4" />
        <p className="text-large font-medium">Failed to load profile</p>
        <p className="text-small text-default-500">Please try again later</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <Icon icon="solar:user-plus-bold" className="h-12 w-12 text-default-400 mb-4" />
        <p className="text-large font-medium">No profile found</p>
        <p className="text-small text-default-500">Contact support to set up your profile</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-default-500 mt-2">
          Manage your collaborator profile information
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Avatar 
                className="h-16 w-16"
                name={profile.artist_name || profile.legal_name || "U"}
                showFallback
              />
              <div>
                <h2 className="text-xl font-semibold">
                  {profile.artist_name || profile.legal_name || "No name set"}
                </h2>
                <p className="text-small text-default-500">
                  {profile.email || "No email set"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    color="primary"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="bordered"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  color="primary"
                  onClick={handleEdit}
                >
                  <Icon icon="solar:pen-bold" className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField
              label="Legal Name"
              field="legal_name"
              value={profile.legal_name}
              placeholder="Enter your full legal name"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
            
            <ProfileField
              label="Artist Name"
              field="artist_name"
              value={profile.artist_name}
              placeholder="Enter your artist/stage name"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
            
            <ProfileField
              label="Email Address"
              field="email"
              value={profile.email}
              type="email"
              placeholder="Enter your email address"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
              disabled={true}
              disabledMessage="Update your email in account settings"
            />
            
            <ProfileField
              label="Phone Number"
              field="phone_number"
              value={profile.phone_number}
              type="tel"
              placeholder="Enter your phone number"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
              disabled={true}
              disabledMessage="Update your phone number in account settings"
            />
            
            <ProfileField
              label="Region"
              field="region"
              value={profile.region}
              placeholder="Enter your region/location"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
            
            <ProfileField
              label="PRO"
              field="pro"
              value={profile.pro}
              placeholder="Enter your PRO (e.g., ASCAP, BMI)"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
            
            <ProfileField
              label="PRO ID"
              field="pro_id"
              value={profile.pro_id}
              placeholder="Enter your PRO member ID"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
            
            <ProfileField
              label="Profile Link"
              field="profile_link"
              value={profile.profile_link}
              type="text"
              placeholder="Enter your website or social media link"
              isEditing={isEditing}
              editFormData={editFormData}
              onInputChange={handleInputChange}
            />
          </div>
          
          <ProfileField
            label="Bio"
            field="bio"
            value={profile.bio}
            placeholder="Tell us about yourself and your music..."
            multiline
            isEditing={isEditing}
            editFormData={editFormData}
            onInputChange={handleInputChange}
          />
        </CardBody>
      </Card>
      
      <div className="mt-6 text-xs text-default-400">
        <p>
          Last updated: {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "Never"}
        </p>
      </div>
    </div>
  );
};

export default Profile;
