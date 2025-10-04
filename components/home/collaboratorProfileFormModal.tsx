import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const CollaboratorProfileFormModal = ({ collaboratorProfileId }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [collaboratorData, setCollaboratorData] = useState({
    legalName: "",
    artistName: "",
    email: "",
    region: "",
    pro: "",
    proId: "",
    profileLink: "",
    bio: "",
  });

  const collaboratorProfileQuery = useQuery({
    queryKey: ["collaboratorProfile", collaboratorProfileId],
    queryFn: () =>
      axios
        .get(`/api/collaborators/${collaboratorProfileId}`)
        .then((res) => res.data),
  });

  useEffect(() => {
    if (collaboratorProfileQuery.data) {
      const profile = collaboratorProfileQuery.data;
      setCollaboratorData({
        legalName: profile.legalName || "",
        artistName: profile.artistName || "",
        email: profile.email || "",
        region: profile.region || "",
        pro: profile.pro || "",
        proId: profile.proId || "",
        profileLink: profile.profileLink || "",
        bio: profile.bio || "",
      });
    }
  }, [collaboratorProfileQuery.data]);

  const onOpen = () => {
    setIsOpen(true);
    collaboratorProfileQuery.refetch();
  };

  const handleCollaboratorDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCollaboratorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateCollaborator = useMutation({
    mutationFn: async () => {
      return axios
        .put(`/api/collaborators/${collaboratorProfileId}`, {
          ...collaboratorData,
        })
        .then((res) => res.data);
    },
    mutationKey: ["updateCollaborator"],
    onSuccess: (data) => {
      toast.success("Collaborator Updated");
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      setIsOpen(false);
    },
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    updateCollaborator.mutate();
  };

  return (
    <>
      <Button onPress={onOpen} variant="light">
        Add Collaborator Info
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex-col pt-8">
            <h1 className="text-large font-semibold">Update Collaborator</h1>
            <p className="text-small font-normal text-default-400"></p>
          </ModalHeader>
          <ModalBody className="pb-8">
            <Form onSubmit={onSubmit} className="flex flex-col gap-6">
              <Input
                label="Legal Name"
                name="legalName"
                placeholder="Enter legal name"
                value={collaboratorData.legalName}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Artist Name"
                name="artistName"
                placeholder="Enter Artist name"
                value={collaboratorData.artistName}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Email"
                name="email"
                placeholder="Enter Email"
                value={collaboratorData.email}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Region"
                name="region"
                placeholder="Enter region"
                value={collaboratorData.region}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Pro"
                name="pro"
                placeholder="Enter pro"
                value={collaboratorData.pro}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Pro ID"
                name="proId"
                placeholder="Enter pro ID"
                value={collaboratorData.proId}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Profile Link"
                name="profileLink"
                placeholder="Enter profile link"
                value={collaboratorData.profileLink}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Bio"
                name="bio"
                placeholder="Enter bio"
                value={collaboratorData.bio}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={onSubmit}
              // isDisabled={!isStep2Valid() || isSubmitting}
              isLoading={isSubmitting}
            >
              Update Collaborator
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
