import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export const Publishing = () => {
  const data = [
    { id: 1, name: 'Dreamworld Records', smth: '50%', smth2: '30%' },
    { id: 2, name: 'Napalm Records', smth: '40%', smth2: '60%' },
  ];

  return (
    <div>
      <h2 className="mb-[28px]">Publishing</h2>
      <div className="overflow-x-auto overflow-y-hidden">
        <TableHeader />
        {data.map(({ id, name, smth, smth2 }) => (
          <TableRow key={id} name={name} smth={smth} smth2={smth2} />
        ))}
      </div>
    </div>
  );
};
