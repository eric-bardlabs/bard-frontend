"use client";

import { SongCollaboratorProfile } from "@/db/schema";
import { Plus } from "lucide-react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  TableRow,
  TableCell
} from "@heroui/react";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { STATUSES } from "@/components/songs/types/song";

interface Props {
  title?: string;
  songId: string;
  albumId?: string;
  collaborators?: Array<SongCollaboratorProfile>;
  streams?: string;
  datePublished?: string;
  collectionUrl?: string;
  status?: string;
  pitch?: string;
  artist?: string;
  releaseDate?: string;
  albumName?: string;
  albums?: Array<any>;
}

export const SongTableRow = ({
  title = "Song title goes here",
  collaborators = [],
  streams = "000,000,000",
  songId,
  datePublished = "00/00/0000",
  collectionUrl = "",
  releaseDate = "00/00/0000",
  artist,
  status,
  pitch,
  albumName,
  albums,
}: Props) => {
  const router = useRouter();

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));

  const [selectedAlbum, setSelectedAlbum] = useState<Set<string>>(new Set([]));

  const selectedAlbumName = useMemo(
    () => Array.from(selectedAlbum).join(", ").replace(/_/g, ""),
    [selectedAlbum]
  );

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(", ").replace(/_/g, ""),
    [selectedKeys]
  );
  return (
    <TableRow onClick={() => router.push(collectionUrl)}>
      <TableCell>{title}</TableCell>
      <TableCell>{artist}</TableCell>
      <TableCell>
        <Dropdown>
          <DropdownTrigger>
            <Button className="capitalize" variant="bordered">
              {selectedAlbumName?.length == 0 ? albumName : selectedAlbumName}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Single selection example"
            selectedKeys={status}
            selectionMode="single"
            variant="flat"
            onSelectionChange={(keys) => setSelectedAlbum(keys as Set<string>)}
          >
            {(albums ?? []).map((album) => (
              <DropdownItem key={album.title}>{album.title}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </TableCell>
      <TableCell>
        <Dropdown>
          <DropdownTrigger>
            <Button className="capitalize" variant="bordered">
              {selectedValue.length == 0 ? status : selectedValue}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Single selection example"
            selectedKeys={status}
            selectionMode="single"
            variant="flat"
            onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
          >
            {STATUSES.map((status) => {
              return <DropdownItem key={status}>{status}</DropdownItem>;
            })}
          </DropdownMenu>
        </Dropdown>
      </TableCell>
      <TableCell className="flex gap-2 flex-wrap">
        {collaborators.map((collaborator, idx) => {
          if (idx <= 2)
            return (
              <Badge key={collaborator.id} className="truncate">
                {collaborator?.collaboratorProfile?.artistName}
              </Badge>
            );
          if (idx === 3) return <Plus size={20} />;
        })}
      </TableCell>
      <TableCell className="text-right">
        {releaseDate ? new Date(releaseDate).toDateString() : ""}
      </TableCell>
    </TableRow>
  );
};
