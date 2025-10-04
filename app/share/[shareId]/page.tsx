"use client";

import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Tabs, Tab } from "@heroui/react";
import { Overview } from "../../../modules/songs/components/Song/overview";
import { Composition } from "../../../modules/songs/components/Song/composition";
import { getSharedTrack } from "@/lib/api/share";

const Share = () => {
  const pathname = usePathname();
  const shareId = pathname
    ? (pathname ?? "").split("/share/")[1]
    : null;

  const shareContentQuery = useQuery({
    queryKey: ["shareContent", shareId],
    queryFn: () => getSharedTrack(shareId!),
    enabled: !!shareId,
  });

  if (shareContentQuery.isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (shareContentQuery.isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1>Share link invalid</h1>
      </div>
    );
  }

  const track = shareContentQuery?.data?.track;
  const collaborators = shareContentQuery?.data?.collaborators || [];

  if (shareContentQuery.isSuccess) {
    return (
      <div className="container">
        <div className="flex-col flex-grow">
          <Tabs
            aria-label="Navigation Tabs"
            classNames={{
              base: "block",
              tabList:
                "w-full rounded-none p-0 gap-8 lg:gap-12 border-b justify-center",
              tab: "max-w-fit px-0 h-12",
              cursor: "w-full",
              tabContent: "text-default-400",
            }}
            radius="full"
            variant="underlined"
          >
            <Tab
              key="account-settings"
              className="self-center flex flex-col items-center w-full"
              textValue="Account Settings"
              title={
                <div className="flex items-center gap-1.5">
                  <p>Overview</p>
                </div>
              }
            >
              <Overview
                song={track}
                showPii={false}
                onSongUpdated={() => {}}
                readonly
              />
            </Tab>
            {(shareContentQuery?.data?.allowed_tabs).includes("composition") && (
              <Tab
                key="composition"
                className="self-center flex flex-col items-center w-full"
                textValue="Notification Settings"
                title={
                  <div className="flex items-center gap-1.5">
                    <p>Composition</p>
                  </div>
                }
              >
                <Composition
                  song={track}
                  showPii={false}
                  readonly
                />
              </Tab>
            )}
          </Tabs>
        </div>
      </div>
    );
  }
};

export default Share;
