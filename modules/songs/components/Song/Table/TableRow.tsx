import React from 'react';

interface Props {
  name?: string;
  streamingRevenue?: string;
  ownership?: string;
  contracts?: string;
}

export const TableRow = ({
  name = 'Collaborator name',
  streamingRevenue = '30%',
  ownership = '40%',
  contracts = 'contracts will go here',
}: Props) => {
  return (
    <div className="grid text-grayDark py-[12px] border-b border-grayLight grid-cols-9 md:grid-cols-11 gap-x-[8px] md:gap-x-[24px] min-w-[670px] md:min-w-[550px]">
      <p className="col-span-3 text-dark">{name}</p>
      <p className="col-span-1 md:col-span-2">{streamingRevenue}</p>
      <p className="col-span-1 md:col-span-2">{ownership}</p>
      <p className="col-span-4">{contracts}</p>
    </div>
  );
};
