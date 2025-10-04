"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { createTrack } from "@/lib/api/tracks";
import {
  Form,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import SongBasicInfoForm from "@/components/songs/song-basic-info-form";
import { Icon } from "@iconify/react";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { AlbumOption } from "../album/AlbumSingleSelect";

interface SimpleNewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  successCallback?: (songId?: string, songData?: any) => void;
}

export const SimpleNewSongModal: React.FC<SimpleNewSongModalProps> = ({
  isOpen,
  onClose,
  successCallback,
}) => {
  const { getToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [songFormData, setSongFormData] = React.useState({
    title: "",
    status: "",
    pitch: "",
    notes: "",
    isrc: "",
    upc: "",
    sixd: "",
  });

  const [projectStartDate, setProjectStartDate] = React.useState<any>(null);
  const [releaseDate, setReleaseDate] = React.useState<any>(null);

  // Artist and collaborator state for the new components
  const [selectedAlbum, setSelectedAlbum] = React.useState<AlbumOption | null>(null);
  const [selectedArtist, setSelectedArtist] = React.useState<CollaboratorSelection | null>(null);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<CollaboratorSelection[]>([]);

  const createNewSong = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      
      // Format dates for API
      const formatDate = (date: any) => {
        if (!date) return undefined;
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      // Prepare collaborators data
      const collaboratorsData = selectedCollaborators.map(c => ({ id: c.id }));

      return createTrack({
        token: token as string,
        data: {
          display_name: songFormData.title,
          album_id: selectedAlbum?.id || undefined,
          artist_id: selectedArtist?.id || undefined,
          status: songFormData.status,
          isrc: songFormData.isrc || undefined,
          upc: songFormData.upc || undefined,
          sixid: songFormData.sixd || undefined,
          pitch: songFormData.pitch || undefined,
          notes: songFormData.notes || undefined,
          project_start_date: formatDate(projectStartDate),
          release_date: formatDate(releaseDate),
          collaborators: collaboratorsData,
        },
      });
    },
    mutationKey: ["createNewSong"],
    onSuccess: (data) => {
      toast.success("Song Created!");
      setIsSubmitting(false);
      onClose();
      successCallback?.(data.id, data);
    },
    onError: (error: any) => {
      toast.error("Failed to create song: " + (error.message || "Unknown error"));
      setIsSubmitting(false);
    },
  });

  const onCreateSong = () => {
    setIsSubmitting(true);
    createNewSong.mutate();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSong();
  };

  const handleSongFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSongSelectChange = (name: string, value: string) => {
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:music"
              className="text-primary"
              width={24}
              height={24}
            />
            <span>Song Details</span>
          </div>
          <p className="text-sm text-default-500">Basic Information</p>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleFormSubmit} className="space-y-6">
            <SongBasicInfoForm
              songFormData={songFormData}
              handleSongFormChange={handleSongFormChange}
              handleSongSelectChange={handleSongSelectChange}
              songProjectStartDate={projectStartDate}
              setSongProjectStartDate={setProjectStartDate}
              songReleaseDate={releaseDate}
              setSongReleaseDate={setReleaseDate}
              isReleaseStatus={songFormData.status == "Release"}
              // New props for the single select components
              selectedAlbum={selectedAlbum}
              setSelectedAlbum={setSelectedAlbum}
              selectedArtist={selectedArtist}
              setSelectedArtist={setSelectedArtist}
              selectedCollaborators={selectedCollaborators}
              setSelectedCollaborators={setSelectedCollaborators}
            />
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onCreateSong}
            isLoading={isSubmitting}
          >
            Create Song
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
