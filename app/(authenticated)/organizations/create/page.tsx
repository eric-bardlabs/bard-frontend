"use client";

import { useOrganizationList, useSession } from "@clerk/nextjs";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Form,
  Input,
  Spinner,
} from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

const organizationCreator = () => {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganization, setActive } = useOrganizationList();
  const session = useSession();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    if (user.initialStep === 2) {
      router.push("/onboarding_v3");
      return;
    } else if (user.initialStep === null || user.initialStep === undefined) {
      router.push("/home");
      return;
    }
  }

  const changeInitialStep = useMutation({
    mutationFn: async () => {
      return axios
        .post("/api/user/change-initial-step", {})
        .then((res) => res.data);
    },
    mutationKey: ["changeInitialStep"],
    onSuccess: () => {
      router.push("/onboarding_v3");
    },
    onError: (error) => {
      console.error("Failed to change initial step:", error);
      setError("Failed to change initial step. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: any) => {
    // Basic validation
    if (!orgName.trim()) {
      setError("Please enter a organization name");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const createdOrg = await createOrganization!({
        name: orgName,
      });
      await setActive!({
        session: session.session?.id,
        organization: createdOrg.id,
      });
      changeInitialStep.mutate();
    } catch (error) {
      console.error("Failed to create organization:", error);
      setError("Failed to create organization. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Card className="w-[500px] p-4">
        <CardHeader>
          <h3>Create organization</h3>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit} className="space-y-6">
            <Input
              isRequired
              label="Organization name"
              placeholder="Organization name"
              value={orgName}
              onValueChange={setOrgName}
              color={error ? "danger" : "default"}
              errorMessage={error}
            />
          </Form>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default organizationCreator;
