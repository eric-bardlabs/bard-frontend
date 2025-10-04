import React, { useState } from 'react';
import { ManualSongAddition } from './ManualSongAddition/ManualSongAddition';
import { Button } from '@/components/uikit';
import { PlatformSongAddition } from './PlatformSongAddition/PlatformSongAddition';

export enum AddSong {
  manual = 'manual',
  spotify = 'Spotify',
  apple = 'Apple Music',
}

interface Props {
  handleModal: (arg: boolean) => void;
}

export const ModalContent = ({ handleModal }: Props) => {
  const [songAdditionType, setSongAdditionType] = useState<AddSong | null>(null);

  return (
    <>
      {!songAdditionType && (
        <div className="h-full xs:w-[210px] md:w-[400px]">
          <h1>Add song</h1>
          <div className="flex flex-col gap-[12px] grow justify-center">
            <div
              className="xs:text-[18px] md:text-[24px] px-[8px] py-[10px] cursor-pointer hover:text-gray"
              onClick={() => setSongAdditionType(AddSong.manual)}
            >
              Manually
            </div>
            <div
              className="xs:text-[18px] md:text-[24px] px-[8px] py-[10px] cursor-pointer hover:text-gray"
              onClick={() => setSongAdditionType(AddSong.spotify)}
            >
              Pull from Spotify
            </div>
            <div
              className="xs:text-[18px] md:text-[24px] px-[8px] py-[10px] cursor-pointer hover:text-gray"
              onClick={() => setSongAdditionType(AddSong.apple)}
            >
              Pull from Apple Music
            </div>
            <div className="flex justify-end">
              <Button text="Cancel" onClick={() => handleModal(false)} />
            </div>
          </div>
        </div>
      )}
      {songAdditionType === AddSong.manual && (
        <ManualSongAddition cancelManualAddition={setSongAdditionType} />
      )}
      {songAdditionType === AddSong.spotify && (
        <PlatformSongAddition
          platform={AddSong.spotify}
          cancelPlatformAddition={setSongAdditionType}
        />
      )}
      {songAdditionType === AddSong.apple && (
        <PlatformSongAddition
          platform={AddSong.apple}
          cancelPlatformAddition={setSongAdditionType}
        />
      )}
    </>
  );
};
