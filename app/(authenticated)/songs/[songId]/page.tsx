"use client";

import React from "react";
import { ScrollShadow, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Spinner } from "@/components/ui/spinner";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@clerk/nextjs";

import { useParams, useRouter } from "next/navigation";
import SongDetails from "@/components/songs/SongDetails";
import { getTrack, Track } from "@/lib/api/tracks";
import { useAuth } from "@clerk/nextjs";

export default function SingleSong() {
  const params = useParams<{ songId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const songQuery = useQuery<Track>({
    queryKey: ["song", params?.songId],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      return getTrack(params?.songId!, token!);
    },
    enabled: !!params?.songId,
  });

  const song = songQuery?.data;

  if (songQuery.isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  if (song === undefined) {
    router.push("/");
    return;
  }

  return (
    <div className="w-full px-4">
      <div className="flex flex-col gap-2">
        <Breadcrumbs className="flex" radius="full">
          <BreadcrumbItem
            onClick={() => {
              router.push("/songs");
            }}
          >
            Songs
          </BreadcrumbItem>
          <BreadcrumbItem>{song?.display_name}</BreadcrumbItem>
        </Breadcrumbs>
      </div>
      <main className="flex w-full justify-center items-start">
        <ScrollShadow
          hideScrollBar
          className="flex w-full max-w-full justify-between gap-8 border-divider"
          orientation="horizontal"
        >
          <SongDetails
            song={song}
            onSongUpdated={() => {
              songQuery.refetch();
            }}
          />
        </ScrollShadow>
      </main>
    </div>
  );
}
