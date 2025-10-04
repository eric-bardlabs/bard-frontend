import { STATUSES } from "@/components/songs/types/song";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Album } from "@/lib/api/albums";
import { Collaborator } from "@/lib/api/collaborators";

export const NewTrackModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  addTrack: (track: any) => void;
  artists: Collaborator[];
  albums: Album[];
}) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [name, setName] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<any>(new Set([]));
  const [albumId, setAlbumId] = useState<any>(new Set([]));
  const [status, setStatus] = useState<any>(new Set([]));
  const [isrc, setIsrc] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState<Date | null>(null);
  const [pitch, setPitch] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<any>(new Set([]));

  const handleClose = () => {
    props.onClose();
    setName("");
    setArtistId(new Set([]));
    setAlbumId(new Set([]));
    setStatus(new Set([]));
    setIsrc(null);
    setReleaseDate(null);
    setPitch(null);
    setCollaborators(new Set([]));
    setIsSubmitting(false);
    setErrors({});
  };

  const handleSubmit = () => {
    const tmpErrors: any = {};
    if (!name) {
      tmpErrors.name = "Track name is required";
    }

    if (Array.from(status).length === 0) {
      tmpErrors.status = "Status is required";
    }

    if (Object.keys(tmpErrors).length > 0) {
      setErrors(tmpErrors);
      return;
    }

    setIsSubmitting(true);

    const track = {
      name,
      artistId: Array.from(artistId)[0] || null,
      albumId: Array.from(albumId)[0] || null,
      status: Array.from(status)[0] || STATUSES[0],
      isrc,
      releaseDate,
      pitch,
      collaborators: Array.from(collaborators).map((collab: string) => ({
        id: collab,
      })),
    };

    // addCollaborator.mutate(collaborator);
    props.addTrack(track);
    handleClose();
  };

  console.log(errors, errors.legalName);

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>
          <div className="p-4">
            <h2 className="text-lg font-semibold">Add a new song</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <Form>
            <Input
              isRequired
              label="Track Name"
              value={name || ""}
              onValueChange={setName}
              isInvalid={!!errors.name}
              color={errors.name ? "danger" : "default"}
              errorMessage={errors.name}
              placeholder="Enter track name"
            />
            <Select
              label="Artist"
              selectedKeys={artistId}
              onSelectionChange={setArtistId}
            >
              {props.artists.map((artist) => {
                return (
                  <SelectItem key={artist.id}>
                    {artist.legal_name || artist.artist_name || artist.email || ""}
                  </SelectItem>
                );
              })}
            </Select>
            <Select
              label="Album"
              selectedKeys={albumId}
              onSelectionChange={setAlbumId}
            >
              {props.albums.map((album) => {
                return <SelectItem key={album.id}>{album.title}</SelectItem>;
              })}
            </Select>
            <Select
              isRequired
              label="Status"
              selectedKeys={status}
              onSelectionChange={setStatus}
              selectionMode="single"
              isInvalid={!!errors.status}
              errorMessage={errors.status}
              color={errors.status ? "danger" : "default"}
            >
              {STATUSES.map((status) => (
                <SelectItem key={status}>{status}</SelectItem>
              ))}
            </Select>
            <Input
              label="ISRC"
              value={isrc || ""}
              onValueChange={setIsrc}
              placeholder="Enter ISRC code"
            />
            <Input
              label="Release Date"
              type="date"
              value={releaseDate ? releaseDate.toISOString().split('T')[0] : ""}
              onValueChange={(value) => setReleaseDate(new Date(value))}
              placeholder="Select release date"
            />
            <Input
              label="Pitch"
              value={pitch || ""}
              onValueChange={setPitch}
              placeholder="Enter pitch"
            />
            <Select
              label="Collaborators"
              selectedKeys={collaborators}
              onSelectionChange={setCollaborators}
              selectionMode="multiple"
            >
              {props.artists.map((artist) => {
                return (
                  <SelectItem key={artist.id}>
                    {artist.legal_name || artist.artist_name || artist.email || ""}
                  </SelectItem>
                );
              })}
            </Select>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
