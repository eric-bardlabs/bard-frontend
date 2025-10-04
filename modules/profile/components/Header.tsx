import { EditIcon } from '@/components/Icons';
import { Button, Input } from '@/components/uikit';
import Image from 'next/image';
import { useState } from 'react';

interface Props {
  artistName: string;
  artistPicture: string | null;
}

export const Header = ({ artistName, artistPicture }: Props) => {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [name, setName] = useState<string>('Ari Lennox');

  const handleModal = (value: boolean) => {
    setModalIsOpen(value);
  };

  const handleMode = (edit: boolean) => {
    setIsEdit(edit);
  };

  return (
    <div className="relative flex flex-row py-[40px] md:mt-0 justify-between">
      <div className="flex flex-col sm:flex-row gap-[17px] justify-center items-center md:justify-start flex-wrap w-full px-[16px] md:px-0">
        <input type="file" id="artistPicture" className="hidden" />
        <label htmlFor="artistPicture" className="hover:cursor-pointer">
          {/* <div className="bg-backgroundImage rounded-full w-[167px] h-[167px]" /> */}
          <Image
            src={artistPicture || '/artist.svg'}
            alt="Artist picture"
            width={167}
            height={167}
            className="rounded-full"
          />
        </label>
        <div className="flex flex-row items-center gap-[16px]">
          <div className="flex flex-col gap-[16px]">
            <h1>{name}</h1>
            {isEdit && (
              <div className="flex flex-col items-end sm:flex-row gap-[16px] items-end">
                <Input
                  type="text"
                  label="Artist name"
                  value={name}
                  setValue={(value) => setName(value)}
                />
                <Button color="dark" text="Save" onClick={() => handleMode(false)} />
              </div>
            )}
          </div>
          {!isEdit && (
            <div className="cursor-pointer" onClick={() => handleMode(true)}>
              <EditIcon firstColor="#494F55" width="24" height="24" />
            </div>
          )}
        </div>
      </div>
      {/* <div className="mb-auto">
        <Button color="dark" text="Edit Profile" onClick={() => handleModal(true)} />
      </div> 
      {modalIsOpen && <Modal title="Title" description="Description" handleModal={handleModal} />} */}
    </div>
  );
};
