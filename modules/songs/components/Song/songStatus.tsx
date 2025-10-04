import { STATUSES } from "@/components/songs/types/song";
import { Chip } from "@heroui/react";

export const SongStatus = (props: { status: string }) => {
  const statusStr =
    props.status && props.status !== "" ? props.status : STATUSES[0];
  return (
    <Chip color="default" size="md">
      {statusStr}
    </Chip>
  );
};
