export const TableHeader = () => {
  return (
    <div className="grid text-grayDark py-[4px] border-b-1 border-grayLight grid-cols-10 md:grid-cols-11 gap-x-[8px] md:gap-x-[24px] min-w-[670px] md:min-w-[550px]">
      <h5 className="col-span-3">Title</h5>
      <h5 className="col-span-3 md:col-span-4">Collaborators</h5>
      <h5 className="col-span-2">Streams</h5>
      <h5 className="col-span-2 min-w-[90px]">Date Published</h5>
    </div>
  );
};
