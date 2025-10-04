import { ArrowIcon } from '@/components/Icons';

export const RelatedContracts = () => {
  const data = [
    {
      id: 1,
      name: 'Agreement.pdf',
    },
    {
      id: 2,
      name: 'Agreement.pdf',
    },
    {
      id: 3,
      name: 'Agreement.pdf',
    },
    {
      id: 4,
      name: 'Agreement.pdf',
    },
    {
      id: 5,
      name: 'Agreement.pdf',
    },
    {
      id: 6,
      name: 'Agreement.pdf',
    },
  ];

  return (
    <div className="flex flex-col">
      <h2 className="border-b-2 border-grayLight pb-[25px]">Related Contracts</h2>
      {data.map(({ id, name }) => (
        <div
          key={id}
          className="flex flex-row justify-between py-[12px] border-b border-grayLight cursor-pointer"
        >
          <div>{name}</div>
          <div className="flex flex-col justify-center rotate-90">
            <ArrowIcon height="16" width="16" firstColor="#9BA4AE" />
          </div>
        </div>
      ))}
    </div>
  );
};
