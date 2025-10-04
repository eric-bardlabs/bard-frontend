import React from 'react';

export const TableHeader = () => {
  return (
    <div className="grid text-grayDark py-[4px] border-b-2 border-grayLight grid-cols-9 md:grid-cols-11 gap-x-[8px] md:gap-x-[24px] min-w-[670px] md:min-w-[550px]">
      <h5 className="col-span-3">Name</h5>
      <h5 className="col-span-1 md:col-span-2">Streaming Revenue</h5>
      <h5 className="col-span-1 md:col-span-2">Ownership</h5>
      <h5 className="col-span-4 min-w-[90px]">Contracts</h5>
    </div>
  );
};
