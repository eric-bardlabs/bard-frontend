import { CopyIcon, Loader2, Share2Icon } from "lucide-react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Track } from "@/lib/api/tracks";
import { createShareLink } from "@/lib/api/share";
import { useAuth } from "@clerk/nextjs";

const ShareSong = ({ song }: { song: Track }) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { getToken } = useAuth();
  const [isNext, setIsNext] = useState(false);
  const [sharedUrl, setSharedUrl] = useState("");
  const [expiredAfter, setExpiredAfter] = useState(new Set(["1"]));
  const [shareContent, setShareContent] = useState(new Set(["overview"]));

  const genUrl = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const response = await createShareLink({
        token,
        trackId: song.id,
        organizationId: song.organization_id || "",
        shareContent: Array.from(shareContent),
        expiredAfter: parseInt(Array.from(expiredAfter)[0]),
      });
      
      setSharedUrl(
        `${window.location.origin}/share/${response.share_id.split("share_")[1]}`
      );
      setIsNext(true);
    },
    onError: (err) => {
      console.error("Failed to create share link:", err);
      toast.error("Failed to create share link");
    },
  });

  const closeDialog = () => {
    setIsNext(false);
    setSharedUrl("");
    setExpiredAfter(new Set(["1"]));
    setShareContent(new Set(["overview"]));
    onClose();
  };

  return (
    <div>
      <Button startContent={<Share2Icon />} variant="light" onPress={onOpen}>
        Share Song
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        onClose={closeDialog}
      >
        <ModalContent>
          <ModalHeader>Share song</ModalHeader>
          <ModalBody>
            {isNext ? (
              <div className="flex flex-row gap-2 items-center">
                <Input label="Share Link" value={sharedUrl} disabled />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Select
                  label="Share expiration time"
                  placeholder="Select an option"
                  selectedKeys={expiredAfter}
                  onSelectionChange={(keys: any) => {
                    if (keys.size === 0) {
                      setExpiredAfter(new Set(["1"]));
                    } else {
                      setExpiredAfter(keys);
                    }
                  }}
                >
                  <SelectItem key={"1"}>One Hour</SelectItem>
                  <SelectItem key={"2"}>Two Hours</SelectItem>
                  <SelectItem key={"3"}>Three Hours</SelectItem>
                  <SelectItem key={"5"}>Five Hours</SelectItem>
                  <SelectItem key={"10"}>Ten Hours</SelectItem>
                </Select>
                <Select
                  disabledKeys={["overview"]}
                  selectionMode="multiple"
                  label="Share content"
                  placeholder="Select an option"
                  selectedKeys={shareContent}
                  onSelectionChange={(keys: any) => setShareContent(keys)}
                >
                  <SelectItem
                    key={"overview"}
                    className="text-muted-foreground"
                  >
                    Overview
                  </SelectItem>
                  <SelectItem key={"composition"}>Composition</SelectItem>
                </Select>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {isNext ? (
              <Button
                startContent={<CopyIcon />}
                color="primary"
                onPress={() => {
                  navigator.clipboard.writeText(sharedUrl);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy Link
              </Button>
            ) : (
              <div className="flex flex-row gap-2">
                <Button color="default" variant="light" onPress={closeDialog}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    console.log("share next");
                    genUrl.mutate();
                  }}
                  startContent={
                    genUrl.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : null
                  }
                  disabled={genUrl.isPending}
                >
                  Next
                </Button>
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ShareSong;
