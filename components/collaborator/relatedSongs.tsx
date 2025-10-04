import { Link, Tooltip, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

interface Song {
  id: string;
  displayName: string;
}

interface RelatedSongsProps {
  songs: Song[];
}

export const RelatedSongs = ({ songs }: RelatedSongsProps) => {
  if (songs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-default-400">
        <span className="text-sm">---</span>
      </div>
    );
  }

  // Show up to 2 songs directly
  const visibleSongs = songs.slice(0, 2);
  const remainingSongs = songs.slice(2);

  return (
    <div className="flex flex-col gap-2 max-w-[250px]">
      {/* Visible songs */}
      {visibleSongs.map((song) => (
        <Link 
          key={song.id} 
          href={`/songs/${song.id}`} 
          color="primary" 
          size="sm"
          className="flex items-center gap-2 text-left max-w-full"
        >
          <Icon icon="lucide:music" className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{song.displayName}</span>
        </Link>
      ))}
      
      {/* +X more chip with tooltip */}
      {remainingSongs.length > 0 && (
        <Tooltip
          content={
            <div className="max-w-xs p-2">
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {songs.map((song) => (
                  <Link 
                    key={song.id}
                    href={`/songs/${song.id}`}
                    color="primary"
                    size="sm"
                    className="block text-left hover:bg-default-100 rounded px-2 py-1 -mx-2"
                  >
                    {song.displayName}
                  </Link>
                ))}
              </div>
            </div>
          }
          placement="right"
          delay={300}
          className="max-w-xs"
        >
          <Chip
            variant="flat"
            color="primary"
            size="sm"
            className="cursor-pointer hover:bg-primary-100 transition-colors"
            startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
          >
            {remainingSongs.length} more
          </Chip>
        </Tooltip>
      )}
    </div>
  );
};
