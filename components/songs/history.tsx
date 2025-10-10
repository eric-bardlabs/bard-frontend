import { Card, CardBody, Divider, Spinner, Button, Chip } from "@heroui/react";
import ShareSong from "@/components/songs/shareSong";
import { useRouter } from "next/navigation";
import { Collaborator } from "@/lib/api/collaborators";
import { SessionCard } from "@/components/sessions/SessionCard";
import { fetchSessionsForSong } from "@/lib/api/sessions";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import dayjs from "dayjs";
import { Track } from "@/lib/api/tracks";

const ITEMS_PER_PAGE = 10;

export const History = (props: {
  song: Track;
  readonly?: boolean;
}) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Calculate 7 days in the future from now
  const sevenDaysFromNow = dayjs().add(7, 'days').toISOString();

  // Query for song sessions
  const sessionsQuery = useQuery({
    queryKey: ["sessions", "song", props.song.id, currentPage],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const response = await fetchSessionsForSong({
        token,
        songId: props.song.id,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        end_time: sevenDaysFromNow, // Sessions ending before 7 days in the future (going backwards from that point)
      });
      
      setHasMore(response.has_more);
      
      if (currentPage === 1) {
        setSessions(response.sessions);
      } else {
        setSessions(prev => [...prev, ...response.sessions]);
      }
      
      return response;
    },
    enabled: !!props.song.id,
  });

  const handleSessionClick = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (sessionsQuery.isLoading && currentPage === 1) {
    return (
      <Card className="w-full">
        <CardBody className="p-6">
          <div className="flex flex-row justify-between items-start w-full mb-6">
            <div className="flex flex-col gap-2 flex-1">
                <p className="font-bold md:text-3xl text-xl max-w-full text-nowrap overflow-hidden text-ellipsis">
                  {props.song.display_name}
                </p>
                <p className="font-semibold text-xl text-muted-foreground">
                  {props.song.artist?.artist_name || props.song.artist?.legal_name || "---"}
                </p>
              {props.song.status && (
                <Chip color="default" size="md">
                  {props.song.status}
                </Chip>
              )}
            </div>
            {!props.readonly && (
              <div className="flex flex-row gap-2 items-center">
                <ShareSong song={props.song} />
              </div>
            )}
          </div>
          <Divider className="my-4" />
          <div className="flex justify-center items-center h-96">
            <Spinner size="lg" color="primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex flex-row justify-between items-start w-full mb-6">
          <div className="flex flex-col gap-2 flex-1">
              <p className="font-bold md:text-3xl text-xl max-w-full text-nowrap overflow-hidden text-ellipsis">
                {props.song.display_name}
              </p>
              <p className="font-semibold text-xl text-muted-foreground">
                {props.song.artist?.artist_name || props.song.artist?.legal_name || "---"}
              </p>
            {props.song.status && (
              <Chip color="default" size="md">
                {props.song.status}
              </Chip>
            )}
          </div>
          {!props.readonly && (
            <div className="flex flex-row gap-2 items-center">
              <ShareSong song={props.song} />
            </div>
          )}
        </div>
        <Divider className="my-4" />
        
        {/* Sessions from last week */}
        {!sessionsQuery.isLoading && (!sessions || sessions.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No sessions found</h3>
              <p className="text-sm text-gray-500">No sessions found for this song</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session.id)}
              />
            ))}
            
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="light"
                  onPress={handleLoadMore}
                  isLoading={sessionsQuery.isLoading && currentPage > 1}
                  endContent={!(sessionsQuery.isLoading && currentPage > 1) && <ChevronDown className="w-4 h-4" />}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  View More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
