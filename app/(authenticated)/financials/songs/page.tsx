"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectItem, Spinner } from "@heroui/react";
import { useAuth } from "@clerk/nextjs";

import { fetchTracks, Track } from "@/lib/api/tracks";
import SongFinancialView from "@/components/financials/SongFinancialView";

export default function SongsFinancialPage() {
  const { getToken } = useAuth();
  const [selectedIsrc, setSelectedIsrc] = useState<string>("");

  // Fetch songs with ISRC for the selector
  const { data: tracksData, isLoading: isLoadingTracks } = useQuery({
    queryKey: ["songs-with-isrc"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No authentication token");
      }
      
      return fetchTracks({
        token,
        limit: 500,
      });
    },
  });

  // Filter tracks that have ISRC and deduplicate by ISRC
  const songsWithIsrc = tracksData?.tracks?.filter(
    (track: Track) => track.isrc && track.isrc.trim() !== ""
  ).reduce((unique: Track[], track: Track) => {
    if (!unique.find(t => t.isrc === track.isrc)) {
      unique.push(track);
    }
    return unique;
  }, []) || [];

  const handleSongChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedIsrc(selectedKey || "");
  };

  const selectedSong = songsWithIsrc.find(song => song.isrc === selectedIsrc);

  if (isLoadingTracks) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Song Financial Dashboard
        </h1>
        <p className="text-gray-600">
          Select a song to view detailed financial performance data
        </p>
      </div>

      {/* Song Selector */}
      <div className="mb-6">
        <Select
          placeholder="Select a song to view financial data"
          className="max-w-md"
          selectedKeys={selectedIsrc ? [selectedIsrc] : []}
          onSelectionChange={handleSongChange}
        >
          {songsWithIsrc.map((song) => (
            <SelectItem key={song.isrc!} >
              {song.display_name} {song.artist?.artist_name && `• ${song.artist.artist_name}`}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Financial View */}
      {selectedIsrc ? (
        <SongFinancialView 
          isrc={selectedIsrc} 
          title={selectedSong?.display_name}
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <div className="text-xl text-gray-600 mb-2">
            Select a song to view financial data
          </div>
          <div className="text-sm text-gray-500">
            {songsWithIsrc.length} songs available with ISRC data
          </div>
        </div>
      )}
    </div>
  );
}