import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export const Song = () => {
  const data = [{ id: 1, songName: 'Shea Buter Baby', streams: '34,120,000' }];

  return (
    <div>
      <h2 className="mb-[28px]">Song</h2>
      <div className="overflow-x-auto overflow-y-hidden">
        <TableHeader />
        {data.map(({ id, songName, streams }) => (
          <TableRow key={id} songName={songName} streams={streams} />
        ))}
      </div>
    </div>
  );
};
