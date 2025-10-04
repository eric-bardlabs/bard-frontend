"use client";

import { UserProvider } from "@/components/UserContext";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import { HeroUIProvider } from "@heroui/react";
import { usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  const pathName = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      <PostHogProvider client={posthog}>
        <ClerkProvider
          signInForceRedirectUrl={`${pathName}?${searchParams}`}
          signUpForceRedirectUrl={"/organizations/create"}
          appearance={{
            organizationSwitcher: {
              variables: { fontSize: "medium" },
            },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <HeroUIProvider className="h-full">{children}</HeroUIProvider>
            </UserProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </PostHogProvider>
      <Toaster />
    </>
  );
}
