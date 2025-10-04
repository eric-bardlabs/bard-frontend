import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GlobalSearch = ({ organizationId }) => {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const globalSearch = useQuery({
    queryKey: ["globalSearch", organizationId, search],
    queryFn: () =>
      axios
        .get(
          `/api/global_search?organizationId=${organizationId}&search=${search}`
        )
        .then((res) => res.data),
  });

  const sessions = globalSearch.data?.data?.[0] ?? [];
  const tracks = globalSearch.data?.data?.[1] ?? [];

  return (
    <Autocomplete
      aria-label="Search"
      startContent={<SearchIcon />}
      placeholder="Search"
      autoFocus={false}
      isLoading={globalSearch.isLoading}
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
