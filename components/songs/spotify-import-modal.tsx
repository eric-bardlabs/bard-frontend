import React from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { importFromSpotify } from "@/lib/api/spotify";

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SpotifyContentType = "track" | "album" | "playlist" | "artist" | null;

const detectSpotifyType = (url: string): { type: SpotifyContentType; id: string | null } => {
  // Track regex
  const trackRegex = /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const trackMatch = url.match(trackRegex);
  if (trackMatch) {
    return { type: "track", id: trackMatch[1] };
  }

  // Album regex
  const albumRegex = /https:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const albumMatch = url.match(albumRegex);
  if (albumMatch) {
    return { type: "album", id: albumMatch[1] };
  }

  // Playlist regex
  const playlistRegex = /https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const playlistMatch = url.match(playlistRegex);
  if (playlistMatch) {
    return { type: "playlist", id: playlistMatch[1] };
  }

  // Artist regex
  const artistRegex = /https:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const artistMatch = url.match(artistRegex);
  if (artistMatch) {
    return { type: "artist", id: artistMatch[1] };
  }

  return { type: null, id: null };
};

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [spotifyUrl, setSpotifyUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [detectedType, setDetectedType] = React.useState<SpotifyContentType>(null);

  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const organizationId = organization?.id;

  const importFromSpotifyMutation = useMutation({
    mutationFn: async ({ type, spotifyId }: { type: string; spotifyId: string }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No authentication token");
      if (!organizationId) throw new Error("No organization selected");
      
      return importFromSpotify({
        type: type as "track" | "album" | "playlist" | "artist",
        spotifyId,
        organizationId
      }, token);
    },
    mutationKey: ["importFromSpotify"],
    onSuccess: (data) => {
      const typeLabel = detectedType === "track" ? "Song" : 
                       detectedType === "album" ? "Album" : 
                       detectedType === "playlist" ? "Playlist" :
                       "Artist";
      toast.success(`${typeLabel} imported successfully`);
      setIsSubmitting(false);
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Failed to import from Spotify:", error);
      const errorMessage = error?.response?.data?.detail || 
                          "Failed to import from Spotify. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    },
  });

  const handleUrlChange = (value: string) => {
    setSpotifyUrl(value);
    if (error) setError("");
    
    // Detect type as user types
    const { type } = detectSpotifyType(value);
    setDetectedType(type);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // Only call preventDefault if it's a form event
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Basic validation
    if (!spotifyUrl.trim()) {
      setError("Please enter a Spotify URL");
      return;
    }

    // Check if it's a Spotify URL
    if (!spotifyUrl.includes("spotify.com")) {
      setError("Please enter a valid Spotify URL");
      return;
    }

    const { type, id } = detectSpotifyType(spotifyUrl);
    
    if (!type || !id) {
      setError("Invalid Spotify URL. Please paste a link to a song, album, playlist, or artist.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    
    importFromSpotifyMutation.mutate({ type, spotifyId: id });
  };

  const handleButtonPress = () => {
    handleSubmit();
  };

  const handleClose = () => {
    setSpotifyUrl("");
    setError("");
    setDetectedType(null);
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) {
      setSpotifyUrl("");
      setError("");
      setDetectedType(null);
    }
  }, [isOpen]);

  const getTypeIcon = () => {
    switch (detectedType) {
      case "track":
        return "lucide:music";
      case "album":
        return "lucide:disc";
      case "playlist":
        return "lucide:list-music";
      case "artist":
        return "lucide:user";
      default:
        return "lucide:link";
    }
  };

  const getTypeLabel = () => {
    switch (detectedType) {
      case "track":
        return "Song";
      case "album":
        return "Album";
      case "playlist":
        return "Playlist";
      case "artist":
        return "Artist";
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-lg">
              <Icon icon="logos:spotify-icon" width={24} height={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Import from Spotify</h2>
              <p className="text-sm text-default-500">Paste any Spotify link - song, album, playlist, or artist</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <Form onSubmit={handleSubmit}>
            <Input
              isRequired
              label="Spotify URL"
              labelPlacement="outside"
              placeholder="https://open.spotify.com/..."
              value={spotifyUrl}
              onValueChange={handleUrlChange}
              size="lg"
              variant="bordered"
              fullWidth
              classNames={{
                input: "font-mono text-sm",
                inputWrapper: "h-14",
                base: "w-full",
              }}
              startContent={
                <Icon
                  icon="logos:spotify-icon"
                  className="text-default-400 flex-shrink-0"
                  width={20}
                />
              }
              endContent={
                detectedType && (
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    startContent={<Icon icon={getTypeIcon()} className="text-xs" />}
                    className="ml-2 flex-shrink-0"
                  >
                    {getTypeLabel()}
                  </Chip>
                )
              }
              color={error ? "danger" : "default"}
              errorMessage={error}
              description={
                !error && (
                  !spotifyUrl ? (
                    <span className="text-xs text-default-500">
                      Supports songs, albums, and playlists from Spotify
                    </span>
                  ) : (
                    spotifyUrl && !detectedType && (
                      <span className="text-warning-600 text-xs">
                        Please paste a valid Spotify link
                      </span>
                    )
                  )
                )
              }
            />
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
            onPress={handleButtonPress}
            isLoading={isSubmitting}
            isDisabled={isSubmitting || !spotifyUrl.trim()}
            startContent={
              !isSubmitting && detectedType && (
                <Icon icon={getTypeIcon()} />
              )
            }
          >
            {isSubmitting 
              ? "Importing..." 
              : detectedType 
                ? `Import ${getTypeLabel()}`
                : "Import"
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};