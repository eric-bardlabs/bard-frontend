import React from 'react';

export const TableHeader = () => {
  return (
    <div className="grid text-grayDark py-[4px] border-b-2 border-grayLight grid-cols-10 gap-x-[8px] md:gap-x-[24px]">
      <h5 className="col-span-6">Title</h5>
      <h5 className="col-span-4">Streams</h5>
    </div>
  );
};
