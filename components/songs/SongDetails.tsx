"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { Tabs, Tab } from "@heroui/react";
import { Overview } from "@/components/songs/overview";
import { Composition } from "@/components/songs/composition";
import { History } from "@/components/songs/history";
import { Links } from "@/components/songs/links";
import { Financial } from "@/components/songs/financial";
import { useState } from "react";
import { Track } from "@/lib/api/tracks";

const SongDetails = ({
  song,
  onSongUpdated,
}: {
  song: Track;
  onSongUpdated?: () => void;
}) => {
  const [hash, setHash] = useState(window.location.hash || "#overview");
  return (
    <div className="flex-col flex-grow">
      <Tabs
        aria-label="Navigation Tabs"
        classNames={{
          base: "block",
          tabList: "w-full rounded-none p-0 gap-8 lg:gap-12 border-b",
          tab: "max-w-fit px-0 h-12",
          cursor: "w-full",
          tabContent: "text-default-400",
        }}
        radius="full"
        variant="underlined"
        defaultSelectedKey={hash.replace("#", "") || "overview"}
        onSelectionChange={(key) => {
          const newHash = `#${key}`;
          setHash(newHash);
          window.history.replaceState(null, "", newHash);
        }}
      >
        <Tab
          key="overview"
          className="self-center"
          textValue="Overview"
          title={
            <div className="flex items-center gap-1.5">
              <p>Overview</p>
            </div>
          }
        >
          <Overview
            song={song}
            onSongUpdated={onSongUpdated}
            showPii={true}
          />
        </Tab>
        <Tab
          key="composition"
          className="self-center"
          textValue="Composition"
          title={
            <div className="flex items-center gap-1.5">
              <p>Composition</p>
            </div>
          }
        >
          <Composition 
            song={song}
            onSongUpdated={onSongUpdated}
          />
        </Tab>
        <Tab
          key="sessions"
          className="self-center"
          textValue="Sessions"
          title={
            <div className="flex items-center gap-1.5">
              <p>Sessions</p>
            </div>
          }
        >
          <History
            song={song}
          />
        </Tab>
        <Tab
          key="links"
          className="self-center"
          textValue="Links"
          title={
            <div className="flex items-center gap-1.5">
              <p>Links</p>
            </div>
          }
        >
          <Links song={song} />
        </Tab>
        <Tab
          key="financial"
          className="self-center"
          textValue="Financial"
          title={
            <div className="flex items-center gap-1.5">
              <p>Financial</p>
            </div>
          }
        >
          <Financial song={song} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default SongDetails;
