"use client";
import { Layout } from "@/components/Layout";
import "@/styles/globals.css";
import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useQuery({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
  });

  React.useEffect(() => {
    if (user) {
      if (user.initialStep === 1 || user.initialStep === 2) {
        router.push("/onboarding_v3");
      }
      // else if (user.initialStep === 2) {
      //   router.push("/organizations/create");
      // }
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <Suspense>
          <Layout>{children}</Layout>
        </Suspense>
      </SignedIn>
      <SignedOut>
        <div className="flex h-screen w-screen items-center justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#161616",
                colorText: "#161616",
              },
            }}
            signUpUrl="/sign-up"
            routing="hash"
          />
        </div>
      </SignedOut>
    </>
  );
}
