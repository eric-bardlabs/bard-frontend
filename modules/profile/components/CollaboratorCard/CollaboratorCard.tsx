import React from 'react';
import Image from 'next/image';

interface Props {
  picture: string | null;
  name: string;
  role: string;
}

export const CollaboratorCard = ({ picture, name, role }: Props) => {
  return (
    <div className="flex flex-row items-center gap-[16px] p-[16px] border border-grayLight rounded md:min-w-[340px]">
      <Image
        src={picture || '/artist.svg'}
        alt="Collaborator picture"
        width={86}
        height={86}
        className="rounded-full"
      />
      <div className="flex flex-col gap-[8px]">
        <h3>{name}</h3>
        <span>{role}</span>
      </div>
    </div>
  );
};
