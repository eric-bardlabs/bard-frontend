import React from 'react';

export const Dates = () => {
  const data = {
    executed: 'Executed: 01/01/2023',
    start: 'Start: 01/01/2023',
    renewal: 'Renewal: 01/01/2024',
    inflectionPoint: 'Inflection Point: 01/01/2024',
    cancellation: 'Cancellation: 01/01/2026',
    end: 'End: 01/01/2025',
  };

  return (
    <div className="flex flex-col">
      <h2 className="border-b-2 border-grayLight pb-[25px]">Dates</h2>
      <div className="py-[12px] border-b border-grayLight">{data.executed}</div>
      <div className="py-[12px] border-b border-grayLight">{data.start}</div>
      <div className="py-[12px] border-b border-grayLight">{data.renewal}</div>
      <div className="py-[12px] border-b border-grayLight">{data.inflectionPoint}</div>
      <div className="py-[12px] border-b border-grayLight">{data.cancellation}</div>
      <div className="py-[12px] border-b border-grayLight">{data.end}</div>
    </div>
  );
};
