import React from "react";
import { Listbox, ListboxItem, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Song } from "../songs/types/song";
import { useRouter } from "next/navigation";

interface SessionSongsProps {
  songs: Song[];
}

export const SessionSongs: React.FC<SessionSongsProps> = ({ songs }) => {
  const router = useRouter();

  // Render status with appropriate color
  const renderStatusCell = (song: Song) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "released":
          return "success";
        case "in progress":
          return "primary";
        case "draft":
          return "warning";
        case "in review":
          return "secondary";
        default:
          return "default";
      }
    };

    return (
      <Chip size="sm" color={getStatusColor(song.status) as any} variant="flat">
        {song.status}
      </Chip>
    );
  };

  return (
    <div className="pb-2">
      <Listbox aria-label="Songs list" variant="flat" className="p-0">
        {songs.map((song) => (
          <ListboxItem
            key={song.id}
            textValue={song.name}
            // startContent={
            //   <Icon
            //     icon="lucide:music-2"
            //     className="w-4 h-4 text-default-500 flex-shrink-0"
            //   />
            // }
            endContent={
              <div className="flex flex-wrap gap-1 justify-end">
                {song.status && renderStatusCell(song)}
              </div>
            }
            className="py-2"
            onPress={() => {
              router.push(`/songs/${song.id}`);
            }}
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{song.name}</p>
              {/* {song.notes && (
                <p className="text-tiny text-default-500 truncate">{song.notes}</p>
              )} */}
            </div>
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
};
