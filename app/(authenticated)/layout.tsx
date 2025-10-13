"use client";
import { Layout } from "@/components/Layout";
import "@/styles/globals.css";
import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";
import { useUserContext } from "@/components/UserContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useUserContext();

  React.useEffect(() => {
    if (user) {
      if (user.initial_step === 1 || user.initial_step === 2) {
        router.push("/onboarding_v3");
      }
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
