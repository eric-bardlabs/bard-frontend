import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const SessionReminderCard = ({ upcomingSessions, recentFinishedSessions }) => {
  const router = useRouter();

  const NEEDS_ATTENTION_COLUMNS = [
    { name: "Label", uid: "label" },
    { name: "Content", uid: "content" },
    { name: "Action", uid: "action" },
  ];

  const renderSessionItem = (session, isUpcoming) => {
    const chipColor = isUpcoming ? "success" : "warning";
    const chipLabel = isUpcoming ? "reminder" : "action";
    
    return (
      <TableRow key={`${isUpcoming ? 'upcoming' : 'finished'}-${session.id}`}>
        <TableCell>
          <Chip color={chipColor} size="sm" variant="flat">
            {chipLabel}
          </Chip>
        </TableCell>
        <TableCell>
          {isUpcoming ? (
            <div className="flex flex-col">
              The session: {session.title}, will start at{" "}
              {dayjs(session.start_time).format("hh:mm A YYYY-MM-DD")}
            </div>
          ) : (
            <div>
              Update songs, collaborators, and splits for Session:{" "}
              {session.title}
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="relative flex justify-end items-center gap-2">
            <Button
              color="default"
              variant="light"
              onPress={() => {
                if (!isUpcoming) {
                  router.push(`sessions/${session.id}?edit=true`);
                } else {
                  router.push(`sessions/${session.id}`);
                }
              }}
            >
              {isUpcoming ? "View Session" : "Edit Post Session"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const hasItems = upcomingSessions.length > 0 || recentFinishedSessions.length > 0;

  return (
    <Table
      isHeaderSticky
      hideHeader
      aria-label="Needs Attention table"
      classNames={{
        wrapper: "max-h-[800px] mb-8",
      }}
      topContent={
        <p className="text-lg font-normal text-default-700">Needs Attention</p>
      }
      topContentPlacement="outside"
    >
      <TableHeader columns={NEEDS_ATTENTION_COLUMNS}>
        {(column: any) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={false}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"All Caught Up!"}>
        {hasItems ? [
          ...upcomingSessions.map(session => renderSessionItem(session, true)),
          ...recentFinishedSessions.map(session => renderSessionItem(session, false))
        ] : []}
      </TableBody>
    </Table>
  );
};

export default SessionReminderCard;
