import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { globalSearch } from "@/lib/api/organization";

const GlobalSearch = ({ organizationId }) => {
  const router = useRouter();
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const globalSearchQuery = useQuery({
    queryKey: ["globalSearch", organizationId, debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) {
        return { sessions: [], tracks: [] };
      }
      
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No auth token available");
      }
      
      return await globalSearch({ token, search: debouncedSearch });
    },
    enabled: !!debouncedSearch.trim(), // Only run query when there's a debounced search term
  });

  const sessions = globalSearchQuery.data?.sessions ?? [];
  const tracks = globalSearchQuery.data?.tracks ?? [];

  return (
    <Autocomplete
      aria-label="Search"
      startContent={<SearchIcon />}
      placeholder="Search"
      autoFocus={false}
      isLoading={globalSearchQuery.isLoading}
      inputValue={search}
      defaultFilter={() => true}
      onInputChange={(value) => setSearch(value)}
    >
      {sessions.length > 0 ? (
        <AutocompleteSection key="sessions" title="Sessions">
          {sessions.map((session: any) => (
            <AutocompleteItem
              key={session.id}
              onPress={() => router.push(`sessions/${session.id}`)}
            >
              {String(session.title)}
            </AutocompleteItem>
          ))}
        </AutocompleteSection>
      ) : null}

      {tracks.length > 0 ? (
        <AutocompleteSection key="tracks" title="Tracks">
          {tracks.map((track: any) => (
            <AutocompleteItem
              key={track.id}
              onPress={() => router.push(`songs/${track.id}`)}
            >
              {String(track.display_name)}
            </AutocompleteItem>
          ))}
        </AutocompleteSection>
      ) : null}
    </Autocomplete>
  );
};

export default GlobalSearch;
