import React from 'react';
import { TableHeader, TableRow } from '.';

const Table = () => {
  return (
    <div className="flex flex-col overflow-auto">
      <TableHeader />
      <TableRow />
      <TableRow />
      <TableRow />
    </div>
  );
};

export default Table;
