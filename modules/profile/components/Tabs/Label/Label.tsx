import { EditIcon } from '@/components/Icons';
import { Button } from '@/components/uikit';
import { useState } from 'react';

interface Props {}

export const Label = () => {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const handleMode = (edit: boolean) => {
    setIsEdit(edit);
  };

  return (
    <div className="flex flex-col flex-1 md:px-[16px] md:border-l md:border-grayLight md:max-w-[550px]">
      <div className="flex flex-row items-center gap-[16px] flex-wrap mb-[24px]">
        <h2>Label</h2>
        {isEdit ? (
          <div className="flex flex-row gap-[8px] grow justify-end">
            <Button color="light" text="Cancel" onClick={() => handleMode(false)} />
            <Button color="dark" text="Save" onClick={() => handleMode(false)} />
          </div>
        ) : (
          <div className="cursor-pointer ml-auto" onClick={() => handleMode(true)}>
            <EditIcon firstColor="#494F55" height="24" width="24" />
          </div>
        )}
      </div>
      <h4 className="font-[700] py-[12px] border-b border-grayLight">Entity Name</h4>
      <div className="flex flex-col gap-[16px] py-[12px] border-b border-grayLight">
        <p>Amit Suneja</p>
        <p>410-555-1234 ext 888</p>
        <p>asuneja@entity.com</p>
      </div>
      {isEdit && (
        <div className="flex flex-row gap-[8px] justify-end mt-[24px]">
          <Button color="light" text="Cancel" onClick={() => handleMode(false)} />
          <Button color="dark" text="Save" onClick={() => handleMode(false)} />
        </div>
      )}
    </div>
  );
};
