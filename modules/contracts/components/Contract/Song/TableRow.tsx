import React from 'react';

interface Props {
  songName?: string;
  streams?: string;
}

export const TableRow = ({ songName = 'Shea Buter Baby', streams = '34,120,000' }: Props) => {
  return (
    <div className="grid text-grayDark py-[12px] border-b border-grayLight grid-cols-10 gap-x-[8px] md:gap-x-[24px]">
      <p className="col-span-6">{songName}</p>
      <p className="col-span-4">{streams}</p>
    </div>
  );
};
