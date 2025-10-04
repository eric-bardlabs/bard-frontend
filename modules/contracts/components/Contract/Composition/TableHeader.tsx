import React from 'react';

export const TableHeader = () => {
  return (
    <div className="grid text-grayDark py-[4px] border-b-2 border-grayLight grid-cols-11 gap-x-[8px] md:gap-x-[24px] md:min-w-[400px]">
      <h5 className="col-span-6">Name</h5>
      <h5 className="col-span-3">Streaming Revenue</h5>
      <h5 className="col-span-2">Ownership</h5>
    </div>
  );
};
