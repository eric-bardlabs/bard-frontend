import { STATUSES } from "./types/song";
import { Collaborator } from "@/lib/api/collaborators";
import React from "react";
import { DatePicker, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { MultiSelect } from "../multi-select-with-search";
import { CollaboratorMultiSelect } from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { AlbumSingleSelect, AlbumOption } from "@/components/album/AlbumSingleSelect";

interface SongBasicInfoFormProps {
  songFormData: {
    title: string;
    status: string;
    pitch: string;
    notes: string;
    isrc: string;
    upc: string;
    sixd: string;
  };
  handleSongFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSongSelectChange: (name: string, value: string) => void;
  songProjectStartDate: any;
  setSongProjectStartDate: (date: any) => void;
  songReleaseDate: any;
  setSongReleaseDate: (date: any) => void;
  isReleaseStatus: boolean;
  selectedArtist: CollaboratorSelection | null;
  setSelectedArtist: (artist: CollaboratorSelection | null) => void;
  selectedCollaborators: CollaboratorSelection[];
  setSelectedCollaborators: (collaborators: CollaboratorSelection[]) => void;
  selectedAlbum: AlbumOption | null;
  setSelectedAlbum: (album: AlbumOption | null) => void;
}

const SongBasicInfoForm: React.FC<SongBasicInfoFormProps> = ({
  songFormData,
  handleSongFormChange,
  handleSongSelectChange,
  songProjectStartDate,
  setSongProjectStartDate,
  songReleaseDate,
  setSongReleaseDate,
  isReleaseStatus,
  // New props for the single select components
  selectedArtist,
  setSelectedArtist,
  selectedCollaborators,
  setSelectedCollaborators,
  selectedAlbum,
  setSelectedAlbum,
}) => {
  return (
    <div className="space-y-4 w-full">
      {/* Primary Information - Most Important Fields */}
      <div className="space-y-3">
        <Input
          isRequired
          label="Song Title"
          name="title"
          placeholder="Enter song title"
          value={songFormData.title}
          onChange={handleSongFormChange}
          variant="bordered"
          size="lg"
          classNames={{
            base: "w-full",
            mainWrapper: "w-full",
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <AlbumSingleSelect
            defaultSelected={selectedAlbum}
            setSelected={(album) => {
              setSelectedAlbum(album);
            }}
            variant="form"
            label="Album"
            placeholder="Select album (optional)"
          />

          <Select
            label="Status"
            placeholder="Select status"
            selectedKeys={songFormData.status ? [songFormData.status] : []}
            onChange={(e) => handleSongSelectChange("status", e.target.value)}
            variant="bordered"
            classNames={{
              base: "w-full",
              trigger: "w-full",
            }}
          >
            {STATUSES.map((status) => (
              <SelectItem key={status}>{status}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Artist and Collaborators Section */}
      <div className="space-y-3 p-3 bg-default-50 rounded-lg">
        <h3 className="text-sm font-semibold text-default-700">Artists & Collaborators</h3>
        
        <CollaboratorSingleSelect
          label="Primary Artist"
          defaultSelected={selectedArtist}
          setSelected={(collaborator) => {
            setSelectedArtist(collaborator);
          }}
          title="Select primary artist"
          placeholder="Search for primary artist..."
          useLegalName={false}
          showClearButton={true}
        />

        <div className="w-full">
          <CollaboratorMultiSelect
            defaultSelected={selectedCollaborators}
            setSelected={(value) => {
              setSelectedCollaborators(value);
            }}
            title="Additional Collaborators"
          />
        </div>
      </div>

      {/* Project Details Section */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Project Start Date"
            value={songProjectStartDate}
            onChange={setSongProjectStartDate}
            variant="bordered"
            classNames={{
              base: "w-full",
            }}
          />

          <DatePicker
            label="Release Date"
            value={songReleaseDate}
            onChange={setSongReleaseDate}
            variant="bordered"
            classNames={{
              base: "w-full",
            }}
          />
        </div>

        <Textarea
          label="Pitch / Description"
          name="pitch"
          placeholder="Describe the song concept, mood, or pitch..."
          value={songFormData.pitch}
          onChange={handleSongFormChange}
          variant="bordered"
          minRows={2}
          maxRows={4}
          classNames={{
            base: "w-full",
            input: "w-full",
          }}
        />
      </div>

      {/* Release Information - Only shown when status is Released */}
      {isReleaseStatus && (
        <div className="space-y-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
          <h3 className="text-sm font-semibold text-warning-700">Release Information</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ISRC"
              name="isrc"
              placeholder="Enter ISRC code"
              value={songFormData.isrc}
              onChange={handleSongFormChange}
              variant="bordered"
              size="sm"
              classNames={{
                base: "w-full",
                mainWrapper: "w-full",
              }}
            />

            <Input
              label="UPC"
              name="upc"
              placeholder="Enter UPC code"
              value={songFormData.upc}
              onChange={handleSongFormChange}
              variant="bordered"
              size="sm"
              classNames={{
                base: "w-full",
                mainWrapper: "w-full",
              }}
            />
          </div>

          <Input
            label="SIXD"
            name="sixd"
            placeholder="Enter SIXD"
            value={songFormData.sixd}
            onChange={handleSongFormChange}
            variant="bordered"
            size="sm"
            classNames={{
              base: "w-full",
              mainWrapper: "w-full",
            }}
          />
        </div>
      )}

      {/* Additional Notes */}
      <Textarea
        label="Additional Notes"
        name="notes"
        placeholder="Any other relevant information..."
        value={songFormData.notes}
        onChange={handleSongFormChange}
        variant="bordered"
        minRows={2}
        maxRows={4}
        classNames={{
          base: "w-full",
          input: "w-full",
        }}
      />
    </div>
  );
};

export default SongBasicInfoForm;
