import React, { useState } from 'react';
import { Button, Input } from '@/components/uikit';
import { AddSong } from '../ModalContent';

interface Props {
  cancelPlatformAddition: (arg: AddSong | null) => void;
  platform: AddSong;
}

export const PlatformSongAddition = ({ cancelPlatformAddition, platform }: Props) => {
  const [songLink, setSongLink] = useState('');

  return (
    <div className="flex flex-col h-full xs:w-[210px] md:w-[380px]">
      <h2>Add link to Your song from {platform}:</h2>
      <div className="flex flex-col gap-[15px] h-full mt-[20px]">
        <Input
          type="text"
          label="Link"
          labelFor="Song Link"
          placeholder="Enter link"
          value={songLink}
          setValue={(link) => setSongLink(link)}
          required
        />
        <div className="flex flex-row gap-[8px] justify-end">
          <Button text="Back" color="light" onClick={() => cancelPlatformAddition(null)} />
          <Button text="Add" color="dark" />
        </div>
      </div>
    </div>
  );
};
