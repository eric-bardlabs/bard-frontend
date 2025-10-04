import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Input,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { SplitsEditor } from "./splits-editor";
import { Track, TrackCollaborator } from "@/lib/api/tracks";
import { Collaborator } from "@/lib/api/collaborators";

interface SongSplitsTableProps {
  songs: Track[];
  refetchTrack: () => void;
}

export const SongSplitsTable: React.FC<SongSplitsTableProps> = ({
  songs,
  refetchTrack,
}) => {


  const [expandedSongs, setExpandedSongs] = React.useState<string[]>([]);

  // Handlers
  const toggleSongExpanded = (songId: string) => {
    setExpandedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };
  return (
    <div className="w-full">
      <Table
        removeWrapper
        aria-label="Song splits table"
        classNames={{
          th: "bg-default-50",
          table: "border border-divider rounded-medium overflow-hidden",
        }}
      >
        <TableHeader>
          <TableColumn>SONG</TableColumn>
          <TableColumn>ARTIST</TableColumn>
          <TableColumn>RELEASE DATE</TableColumn>
          <TableColumn>COLLABORATORS</TableColumn>
          <TableColumn width={120}>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No Splits information available in your catalog">
          {songs.map((song) => {
            const isExpanded = expandedSongs.includes(song.id);
            const currentCollaborators = song.collaborators || [];
            return (
              <React.Fragment key={song.id}>
                <TableRow className="border-b border-divider">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{song.display_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {song.artist?.legal_name ||
                      song.artist?.artist_name ||
                      song.artist?.email ||
                      ""}
                  </TableCell>
                  <TableCell>{song.release_date}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {currentCollaborators.slice(0, 2).map((collaborator) => (
                        <Chip key={collaborator.id} size="sm" variant="flat">
                          {collaborator.legal_name || collaborator.artist_name}
                        </Chip>
                      ))}
                      {currentCollaborators.length > 2 && (
                        <Chip size="sm" variant="flat">
                          +{currentCollaborators.length - 2} more
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Tooltip
                        content={isExpanded ? "Hide splits" : "View splits"}
                      >
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => toggleSongExpanded(song.id)}
                        >
                          <Icon
                            icon={
                              isExpanded
                                ? "lucide:chevron-up"
                                : "lucide:chevron-down"
                            }
                            className="text-default-500"
                          />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-default-50">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4">
                        <SplitsEditor
                          song={song}
                          refetchTrack={refetchTrack}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
