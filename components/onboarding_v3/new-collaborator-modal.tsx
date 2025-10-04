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
import { saveCollaborator } from "@/lib/api/collaborators";
import { useOrganization, useAuth } from "@clerk/nextjs";

export const NewCollaboratorModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const organizationId = organization?.id || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [legalName, setLegalName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [pro, setPro] = useState("");
  const [proId, setProId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleClose = () => {
    props.onClose();
    setLegalName("");
    setArtistName("");
    setEmail("");
    setPro("");
    setProId("");
    setIsSubmitting(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    const tmpErrors: any = {};
    if (!legalName && !artistName) {
      tmpErrors.legalName = "Legal name or artist name is required";
    }

    if (Object.keys(tmpErrors).length > 0) {
      setErrors(tmpErrors);
      return;
    }

    setIsSubmitting(true);

    const collaboratorData = {
      legal_name: legalName,
      artist_name: artistName,
      email,
      pro,
      pro_id: proId,
    };

    const token = await getToken({ template: "bard-backend" });
    if (!token) {
      toast.error("Authentication required");
      setIsSubmitting(false);
      return;
    }

    const result = await saveCollaborator({
      token,
      collaboratorData,
      onSuccess: (data) => {
        toast.success("Collaborator added");
        props.onSuccess?.();
        handleClose();
      },
      onError: (error) => {
        console.error("Failed to save collaborator:", error);
        toast.error("Failed to save collaborator");
        setIsSubmitting(false);
      },
    });
  };

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>
          <div className="p-4">
            <h2 className="text-lg font-semibold">Add Collaborator</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <Form>
            <Input
              isRequired
              label="Legal Name"
              value={legalName}
              onValueChange={setLegalName}
              isInvalid={!!errors.legalName}
              color={errors.legalName ? "danger" : "default"}
              errorMessage={errors.legalName}
              placeholder="Enter legal name"
            />
            <Input
              label="Artist Name"
              value={artistName}
              onValueChange={setArtistName}
              placeholder="Enter artist name"
            />
            <Input
              label="Email"
              value={email}
              onValueChange={setEmail}
              // isInvalid={!!errors.email}
              // color={errors.email ? "danger" : "default"}
              // errorMessage={errors.email}
              placeholder="Enter email address"
            />
            <Select
              label="PRO (Performance Rights Organization)"
              placeholder="Select your PRO"
              onSelectionChange={(keys) => {
                setPro(Array.from(keys)[0] as string);
              }}
              className="max-w-xl"
            >
              <SelectItem key="ASCAP">ASCAP</SelectItem>
              <SelectItem key="BMI">BMI</SelectItem>
              <SelectItem key="SESAC">SESAC</SelectItem>
              <SelectItem key="SOCAN">SOCAN</SelectItem>
            </Select>
            <Input
              label="Pro ID"
              value={proId}
              onValueChange={setProId}
              placeholder="Enter pro ID"
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
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
