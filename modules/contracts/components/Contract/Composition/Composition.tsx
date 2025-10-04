import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export const Composition = () => {
  const data = [
    { id: 1, name: 'Ari Lennox', streamingRevenue: '50%', ownership: '30%' },
    { id: 2, name: 'Cole', streamingRevenue: '40%', ownership: '60%' },
    { id: 3, name: 'Another one', streamingRevenue: '20%', ownership: '10%' },
  ];

  return (
    <div>
      <h2 className="mb-[28px]">Composition</h2>
      <div className="overflow-x-auto overflow-y-hidden">
        <TableHeader />
        {data.map(({ id, name, streamingRevenue, ownership }) => (
          <TableRow
            key={id}
            name={name}
            streamingRevenue={streamingRevenue}
            ownership={ownership}
          />
        ))}
      </div>
    </div>
  );
};
