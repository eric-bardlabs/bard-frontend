import React from 'react';

interface Props {
  name?: string;
  streamingRevenue?: string;
  ownership?: string;
}

export const TableRow = ({
  name = 'Shea Buter Baby',
  streamingRevenue = '34,120,000',
  ownership = '40%',
}: Props) => {
  return (
    <div className="grid text-grayDark py-[12px] border-b border-grayLight grid-cols-11 gap-x-[8px] md:gap-x-[24px] md:min-w-[400px]">
      <p className="col-span-6">{name}</p>
      <p className="col-span-3">{streamingRevenue}</p>
      <p className="col-span-2">{ownership}</p>
    </div>
  );
};
