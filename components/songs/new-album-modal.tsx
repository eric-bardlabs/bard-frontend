"use client";

import React from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { createAlbum } from "@/lib/api/albums";

interface NewAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  successCallback?: () => void;
}

export const NewAlbumModal: React.FC<NewAlbumModalProps> = ({
  isOpen,
  onClose,
  successCallback,
}) => {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const { getToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Album form state
  const [albumFormData, setAlbumFormData] = React.useState({
    title: "",
    upc: "",
    ean: "",
    albumArtUrl: "",
  });

  // Use current date for initial date values
  const [releaseDate, setReleaseDate] = React.useState<any>(null);
  const [startDate, setStartDate] = React.useState<any>(null);
  const [renewalDate, setRenewalDate] = React.useState<any>(null);

  const handleAlbumFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlbumFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetAlbumForm = () => {
    setAlbumFormData({ title: "", upc: "", ean: "", albumArtUrl: "" });
    setReleaseDate(null);
    setStartDate(null);
    setRenewalDate(null);
    setIsSubmitting(false);
  };

  const handleCreateAlbum = async (e: any) => {
    // e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await getToken({ template: "bard-backend" });
      
      // Format dates to ISO strings if they exist
      const formatDate = (date: any) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      await createAlbum({
        token: token as string,
        title: albumFormData.title,
        release_date: formatDate(releaseDate),
        start_date: formatDate(startDate),
        renewal_date: formatDate(renewalDate),
        album_art_url: albumFormData.albumArtUrl || null,
        upc: albumFormData.upc || null,
        ean: albumFormData.ean || null,
        onSuccess: (data) => {
          // Reset form and close modal
          resetAlbumForm();
          successCallback?.();
          onClose();
        },
        onError: (error) => {
          console.error("Failed to create album:", error);
          // In a real app, you would show an error message to the user
        },
      });
    } catch (error) {
      console.error("Failed to create album:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return albumFormData.title.trim() !== "";
  };

  React.useEffect(() => {
    if (isOpen) {
      resetAlbumForm();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:disc"
              className="text-primary"
              width={24}
              height={24}
            />
            <span>Create New Album</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleCreateAlbum} className="space-y-4">
            <Input
              isRequired
              label="Album Title"
              name="title"
              placeholder="Enter album title"
              value={albumFormData.title}
              onChange={handleAlbumFormChange}
              className="w-full"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatePicker
                label="Release Date"
                value={releaseDate}
                onChange={setReleaseDate}
                className="w-full"
              />

              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                className="w-full"
              />

              <DatePicker
                label="Renewal Date"
                value={renewalDate}
                onChange={setRenewalDate}
                className="w-full"
              />
            </div>

            <Input
              label="UPC"
              name="upc"
              placeholder="Enter UPC number"
              value={albumFormData.upc}
              onChange={handleAlbumFormChange}
              className="w-full"
              description="Universal Product Code for the album"
            />
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleCreateAlbum}
            isDisabled={!isFormValid() || isSubmitting}
            isLoading={isSubmitting}
          >
            Create Album
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
