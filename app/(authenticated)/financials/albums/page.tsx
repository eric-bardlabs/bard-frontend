"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useAuth } from "@clerk/nextjs";

import { fetchAlbums, Album } from "@/lib/api/albums";
import AlbumFinancialView from "@/components/financials/AlbumFinancialView";

export default function FinancialsAlbumsPage() {
  const { getToken } = useAuth();
  const [selectedUpc, setSelectedUpc] = useState<string>("");

  console.log("selectedUpc", selectedUpc);

  // Fetch albums for the selector
  const { data: albumsData, isLoading: albumsLoading, error: albumsError } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No authentication token");
      }

      return fetchAlbums({
        token,
        limit: 500, // Get all albums
        includeTrackCount: true,
      });
    },
    enabled: true, // Always enabled since we're in an authenticated route
  });

  // Filter albums that have UPC
  const albumsWithUpc = albumsData?.albums.filter(album => album.upc) || [];

  const handleAlbumChange = (keys: any) => {
    console.log("keys", keys);
    const selectedKey = Array.from(keys)[0] as string;
    console.log("selectedKey", selectedKey);
    setSelectedUpc(selectedKey);
  };

  if (albumsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header with Album Selector */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Album Financial Dashboard
        </h1>
        
        {/* Album Selector */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Select Album</h3>
          </CardHeader>
          <CardBody>
            <div className="max-w-md">
              <Select
                label="Choose an album to view financial data"
                placeholder="Select an album..."
                selectedKeys={selectedUpc ? [selectedUpc] : []}
                onSelectionChange={handleAlbumChange}
                className="max-w-full"
              >
                {albumsWithUpc.map((album) => (
                  <SelectItem 
                    key={album.upc!} 
                    textValue={`${album.title} (${album.upc})`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{album.title}</span>
                      <span className="text-sm text-gray-500">
                        UPC: {album.upc}
                        {album.release_date && ` • ${new Date(album.release_date).getFullYear()}`}
                        {album.track_count && ` • ${album.track_count} tracks`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
              
              {albumsWithUpc.length === 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    📊 No albums with UPC found. Albums need a UPC to display financial data.
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Financial Dashboard - Show when album is selected */}
      {selectedUpc && selectedUpc !== "" ? (
        <AlbumFinancialView 
          upc={selectedUpc} 
          title={`Financial Dashboard - ${albumsWithUpc.find(a => a.upc === selectedUpc)?.title}`}
        />
      ) : (
        /* Placeholder when no album selected */
        <Card>
          <CardBody className="text-center py-16">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Select an Album</h3>
            <p className="text-gray-600">
              Choose an album from the dropdown above to view its financial performance data
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}