/* eslint-disable @next/next/no-img-element */
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

interface SearchFormInputs {
  searchTerm: string;
}

type Props = {
  onClick: (artistName: string, artistId: string) => void;
};

const SearchComponent: React.FC<Props> = ({ onClick }: Props) => {
  const { register, watch, setValue } = useForm<SearchFormInputs>();
  const [results, setResults] = useState<any[]>([]);

  const [hasSelectedArtist, setHasSelectedArtist] = useState<boolean>(false);

  const searchSpotifyArtists = async (searchTerm: string) => {
    try {
      const response = await axios.post(`/api/searchSpotifyArtists`, {
        query: searchTerm,
      });
      setResults(response.data.artists);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle the error as per your needs
    }
  };

  // Debounced function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => searchSpotifyArtists(searchTerm), 300),
    []
  );

  // Watch for changes in the search term
  const searchTerm = watch("searchTerm");

  // Effect to trigger the search
  React.useEffect(() => {
    if (searchTerm) {
      if (!hasSelectedArtist) {
        debouncedSearch(searchTerm);
      } else {
        setHasSelectedArtist(false);
      }
    } else {
      setResults([]);
    }
    // if exhaustive with setHasSelectedArtist, it would just be recurisve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, debouncedSearch]);

  return (
    <Popover open={true}>
      {/**
      
      doing a popover that's always open, but with content that is conditionally
      rendered fixes the problem of losing focus of the input when you type and then
      the popover opens up

      a lot of this is hacky, such as setting results to [] on blur

      */}
      <PopoverTrigger>
        <Input
          type="text"
          {...register("searchTerm")}
          placeholder="Search Spotify Artists"
        />
      </PopoverTrigger>
      <PopoverContent
        asChild
        className={`${results.length === 0 ? "hidden" : "visible"}`}
      >
        <div className="flex flex-col pt-4 h-[300px] overflow-y-auto">
          {results.map((artist, index) => (
            <div
              key={index}
              className="flex items-center hover:bg-slate-200 p-4 rounded gap-4 cursor-pointer w-full"
              onClick={() => {
                onClick(artist.name, artist.id);
                setValue("searchTerm", artist.name);
                setHasSelectedArtist(true);
                setResults([]);
              }}
            >
              <img
                src={artist.images[0]?.url ?? ""}
                className="w-6 h-6"
                alt="artist image"
              />
              {artist.name}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchComponent;
