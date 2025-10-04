import { EditIcon } from '@/components/Icons';
import { Button } from '@/components/uikit';
import { useState } from 'react';
import { Platform } from './Platform';

interface Props {
  platforms: { platform: string; id: number }[];
}

export const PlatformContainer = ({ platforms }: Props) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const handleMode = (edit: boolean) => {
    setIsEdit(edit);
  };

  return (
    <div className="flex flex-col flex-1 w-full mb-[24px] md:px-[16px] md:border-l md:border-grayLight md:max-w-[550px]">
      <div className="flex flex-row items-center gap-[16px] flex-wrap mb-[24px]">
        <h2>Platforms</h2>
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
      {platforms.map(({ platform, id }) => (
        <Platform platform={platform} isEdit={isEdit} id={id} key={id} />
      ))}
      {isEdit && (
        <div className="flex flex-row gap-[8px] justify-end mt-[24px]">
          <Button color="light" text="Cancel" onClick={() => handleMode(false)} />
          <Button color="dark" text="Save" onClick={() => handleMode(false)} />
        </div>
      )}
    </div>
  );
};
