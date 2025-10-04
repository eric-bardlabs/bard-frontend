import React from 'react';
import Image from 'next/image';

export const Header = () => {
  return (
    <div className="flex flex-col items-center gap-[16px] bg-brandSecondary p-[16px]">
      <Image src="/logo-dark.svg" alt="Logo" width={40} height={41} />
      <h3>Bard Labs</h3>
    </div>
  );
};
