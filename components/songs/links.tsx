import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Link,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Accordion,
  AccordionItem,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  LinkIcon,
  MusicIcon,
  ExternalLinkIcon,
  TrashIcon,
  CloudIcon,
  GlobeIcon,
  DiscIcon,
  LayersIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";
import { Track } from "@/lib/api/tracks";

interface ExternalLink {
  id: string;
  song_id: string;
  link_type: string;
  link_url: string;
  display_name?: string;
  link_metadata?: any;
  created_at: string;
  updated_at: string;
}

interface LinkTypeConfig {
  key: string;
  label: string;
  icon: string;
  color: "primary" | "secondary" | "success" | "default";
  description: string;
  placeholder: string;
  examples: string[];
}

// Define the 3 main sections
const LINK_SECTIONS: LinkTypeConfig[] = [
  {
    key: "streaming",
    label: "Streaming",
    icon: "lucide:music",
    color: "primary",
    description: "Apple Music, Spotify, YouTube Music",
    placeholder: "https://open.spotify.com/track/...",
    examples: ["Apple Music", "Spotify", "YouTube Music"],
  },
  {
    key: "versions",
    label: "Versions",
    icon: "lucide:layers",
    color: "secondary",
    description: "Disco and Dropbox links",
    placeholder: "https://www.dropbox.com/s/...",
    examples: ["Disco", "Dropbox"],
  },
  {
    key: "other",
    label: "Other",
    icon: "lucide:globe",
    color: "default",
    description: "All other links",
    placeholder: "https://...",
    examples: ["Social Media", "Press", "Reviews", "Videos"],
  },
];

// Map backend link types to sections
const LINK_TYPE_TO_SECTION: Record<string, string> = {
  'apple': 'streaming',
  'spotify': 'streaming',
  'youtube': 'streaming',
  'disco': 'versions',
  'dropbox': 'versions',
  'other': 'other',
};

// Available link types for the add modal
const AVAILABLE_LINK_TYPES = [
  { value: 'apple', label: 'Apple Music', section: 'streaming' },
  { value: 'spotify', label: 'Spotify', section: 'streaming' },
  { value: 'youtube', label: 'YouTube Music', section: 'streaming' },
  { value: 'disco', label: 'Disco', section: 'versions' },
  { value: 'dropbox', label: 'Dropbox', section: 'versions' },
  { value: 'other', label: 'Other', section: 'other' },
];

interface LinkSectionProps {
  section: LinkTypeConfig;
  links: ExternalLink[];
  songId: string;
  onAddLink: (type: string, url: string, name?: string) => Promise<void>;
  onDeleteLink: (linkId: string) => void;
}

const LinkSection: React.FC<LinkSectionProps> = ({
  section,
  links,
  songId,
  onAddLink,
  onDeleteLink,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkName, setNewLinkName] = useState("");
  const [selectedLinkType, setSelectedLinkType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get available link types for this section
  const sectionLinkTypes = AVAILABLE_LINK_TYPES.filter(
    type => type.section === section.key
  );

  const handleAdd = async () => {
    if (!newLinkUrl) {
      toast.error("Please enter a URL");
      return;
    }
    
    if (!selectedLinkType) {
      toast.error("Please select a link type");
      return;
    }

    try {
      new URL(newLinkUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLink(selectedLinkType, newLinkUrl, newLinkName || undefined);
      setNewLinkUrl("");
      setNewLinkName("");
      setSelectedLinkType("");
      onOpenChange();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLinkIcon = (linkType?: string) => {
    switch (linkType) {
      case "apple":
      case "spotify":
      case "youtube":
        return <MusicIcon size={14} />;
      case "disco":
        return <DiscIcon size={14} />;
      case "dropbox":
        return <CloudIcon size={14} />;
      default:
        return <GlobeIcon size={14} />;
    }
  };
  
  const getLinkDisplayName = (link: ExternalLink) => {
    if (link.display_name) return link.display_name;
    
    // Show friendly names for known types
    const typeNames: Record<string, string> = {
      'apple': 'Apple Music',
      'spotify': 'Spotify',
      'youtube': 'YouTube Music',
      'disco': 'Disco',
      'dropbox': 'Dropbox',
    };
    
    return typeNames[link.link_type] || new URL(link.link_url).hostname;
  };

  return (
    <>
      <div className="space-y-2 pl-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-default-500">{section.description}</p>
          <Button
            size="sm"
            variant="flat"
            color={section.color}
            startContent={<PlusIcon size={14} />}
            onPress={onOpen}
          >
            Add
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-4 bg-default-50 rounded-md">
            <Icon 
              icon={section.icon} 
              className="mx-auto mb-1 text-default-300 text-lg" 
            />
            <p className="text-xs text-default-400">No {section.label.toLowerCase()} links added yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-2.5 bg-default-50 rounded-md hover:bg-default-100 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {getLinkIcon(link.link_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {getLinkDisplayName(link)}
                    </p>
                    <Link
                      href={link.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      <span className="truncate max-w-[250px]">{link.link_url}</span>
                      <ExternalLinkIcon size={10} />
                    </Link>
                  </div>
                </div>
                <Tooltip content="Remove">
                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    size="sm"
                    className="min-w-unit-7 h-unit-7"
                    onPress={() => onDeleteLink(link.id)}
                  >
                    <TrashIcon size={12} />
                  </Button>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon icon={section.icon} className={`text-${section.color}`} />
                  <span>Add {section.label} Link</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Link Type"
                    placeholder="Select a link type"
                    value={selectedLinkType}
                    onChange={(e) => setSelectedLinkType(e.target.value)}
                    variant="bordered"
                    isRequired
                  >
                    {sectionLinkTypes.map(type => (
                      <SelectItem key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <Input
                    label="URL"
                    placeholder={section.placeholder}
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    variant="bordered"
                    startContent={<LinkIcon size={16} className="text-default-400" />}
                    type="url"
                    isRequired
                    description={`Examples: ${section.examples.join(", ")}`}
                  />

                  <Input
                    label="Display Name (Optional)"
                    placeholder={`e.g., ${section.examples[0]}`}
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    variant="bordered"
                    description="Leave empty to use default name"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={() => {
                    setNewLinkUrl("");
                    setNewLinkName("");
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color={section.color}
                  onPress={handleAdd}
                  isLoading={isSubmitting}
                  isDisabled={!newLinkUrl || !selectedLinkType}
                >
                  Add Link
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export const Links = ({ song }: { song: Track }) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Get the correct API URL
  const apiUrl = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || 'http://localhost:8000';

  // Fetch external links
  const { data: links, isLoading } = useQuery({
    queryKey: ["songExternalLinks", song.id],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      const response = await axios.get(
        `${apiUrl}/songs/${song.id}/external-links`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data as ExternalLink[];
    },
    enabled: !!song?.id,
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: {
      link_type: string;
      link_url: string;
      display_name?: string;
    }) => {
      const token = await getToken({ template: "bard-backend" });
      const response = await axios.post(
        `${apiUrl}/songs/${song.id}/external-links`,
        linkData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Link added successfully!");
      queryClient.invalidateQueries({ queryKey: ["songExternalLinks", song.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to add link";
      toast.error(message);
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const token = await getToken({ template: "bard-backend" });
      await axios.delete(
        `${apiUrl}/songs/${song.id}/external-links/${linkId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      toast.success("Link removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["songExternalLinks", song.id] });
    },
    onError: () => {
      toast.error("Failed to remove link");
    },
  });

  const handleAddLink = async (type: string, url: string, name?: string) => {
    await createLinkMutation.mutateAsync({
      link_type: type,
      link_url: url,
      display_name: name,
    });
  };

  const handleDeleteLink = (linkId: string) => {
    deleteLinkMutation.mutate(linkId);
  };

  // Group links by section based on their type
  const getLinksBySection = (sectionKey: string) => {
    if (!links) return [];
    
    return links.filter(link => {
      const section = LINK_TYPE_TO_SECTION[link.link_type] || 'other';
      return section === sectionKey;
    });
  };

  const totalLinks = links?.length || 0;
  

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        {/* Header Section */}
        <div className="flex flex-row justify-between items-start w-full mb-6">
          <div className="flex flex-col gap-2 flex-1">
            <p className="font-bold md:text-3xl text-xl max-w-full text-nowrap overflow-hidden text-ellipsis">
              {song.display_name}
            </p>
            <p className="font-semibold text-xl text-muted-foreground">
              {song.artist?.artist_name || song.artist?.legal_name || "---"}
            </p>
            <div className="text-sm text-default-500">
              External Links · {totalLinks} {totalLinks === 1 ? "link" : "links"} total
            </div>
          </div>
        </div>

        <Divider className="my-4" />

        {/* Links Sections */}
        {isLoading ? (
          <div className="text-center py-8 text-default-400">Loading links...</div>
        ) : (
          <div className="space-y-6">
            {/* Use Accordion for better organization */}
            <Accordion 
              variant="light"
              defaultExpandedKeys={LINK_SECTIONS.map(s => s.key)}
              className="px-0"
              itemClasses={{
                base: "py-0",
                title: "text-sm",
                content: "pt-0 pb-3",
                trigger: "py-2",
              }}
            >
              {LINK_SECTIONS.map((section) => {
                const sectionLinks = getLinksBySection(section.key);
                return (
                  <AccordionItem
                    key={section.key}
                    aria-label={section.label}
                    startContent={
                      <Icon icon={section.icon} className={`text-${section.color} text-base`} />
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{section.label}</span>
                        {sectionLinks.length > 0 && (
                          <Chip size="sm" variant="flat" color={section.color} className="h-5 text-xs">
                            {sectionLinks.length}
                          </Chip>
                        )}
                      </div>
                    }
                  >
                    <LinkSection
                      section={section}
                      links={sectionLinks}
                      songId={song.id}
                      onAddLink={handleAddLink}
                      onDeleteLink={handleDeleteLink}
                    />
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </CardBody>
    </Card>
  );
};