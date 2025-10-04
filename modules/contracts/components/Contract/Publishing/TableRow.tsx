import React from 'react';

interface Props {
  name?: string;
  smth?: string;
  smth2?: string;
}

export const TableRow = ({ name = 'Dreamworld Records', smth = '60%', smth2 = '35%' }: Props) => {
  return (
    <div className="grid text-grayDark py-[12px] border-b border-grayLight grid-cols-11 gap-x-[8px] md:gap-x-[24px] md:min-w-[400px]">
      <p className="col-span-6">{name}</p>
      <p className="col-span-3">{smth}</p>
      <p className="col-span-2">{smth2}</p>
    </div>
  );
};
