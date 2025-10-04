import React from 'react';

export const Filter = () => {
  return (
    <div className="flex flex-row gap-0 sm:gap-[16px] justify-center md:justify-start whitespace-nowrap">
      <button className="bg-[#f0f3f5] px-[16px] py-[14px] rounded w-full sm:max-w-[160px] md:max-w-fit md:min-w-[86px]">
        A-Z
      </button>
      <button className="bg-[#f0f3f5] px-[16px] py-[14px] rounded w-full sm:max-w-[160px] md:max-w-fit md:min-w-[86px]">
        By album
      </button>
      <button className="bg-[#f0f3f5] px-[16px] py-[14px] rounded w-full sm:max-w-[160px] md:max-w-fit md:min-w-[86px]">
        By streams
      </button>
    </div>
  );
};
