import React from "react";
import { Listbox, ListboxItem, Avatar, Chip } from "@heroui/react";
import { Collaborator } from "../songs/types/song";

interface SessionCollaboratorsProps {
  collaborators: Collaborator[];
}

export const SessionCollaborators: React.FC<SessionCollaboratorsProps> = ({ collaborators }) => {
  return (
    <div className="pb-2">
      <Listbox aria-label="Collaborators list" variant="flat" className="p-0">
        {collaborators.map((collaborator) => (
          <ListboxItem
            key={collaborator.id}
            textValue={collaborator.name}
            // startContent={
            //   <Avatar 
            //     src={collaborator.avatar} 
            //     name={collaborator.name} 
            //     size="sm" 
            //     className="mr-2 flex-shrink-0"
            //   />
            // }
            // endContent={
            //   <Chip size="sm" variant="flat" color="primary" className="flex-shrink-0">
            //     {collaborator.role}
            //   </Chip>
            // }
            className="py-2"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{collaborator.name}</p>
              {collaborator.email && (
                <p className="text-tiny text-default-500 truncate">{collaborator.email}</p>
              )}
            </div>
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
};