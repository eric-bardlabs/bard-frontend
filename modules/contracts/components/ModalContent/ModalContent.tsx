import { Button, Input, InputDropdown, RadioButton } from '@/components/uikit';
import React, { useState } from 'react';
import { SongAddition } from './SongAddition';
import { ContractDates } from './ContractDates/ContractDates';
import { UserInfo } from './UserInfo/UserInfo';

export enum ModalStep {
  general = 'General',
  dates = 'Dates',
  userInfo = 'User info',
}

interface Props {
  handleModal: (arg: boolean) => void;
}

export const ModalContent = ({ handleModal }: Props) => {
  const [data, setData] = useState({ contractType: '', song: '' });
  const [modalStep, setModalStep] = useState<ModalStep>(ModalStep.general);

  const contractTypes = ['Type 1', 'Type 2', 'Type 3', 'Type 4'];

  const handleSongSelection = (song: string) => {
    setData({ ...data, song });
  };

  return (
    <div className="h-full xs:w-[210px] md:w-[400px]">
      {modalStep === ModalStep.general && (
        <div className="flex flex-col gap-[16px] grow justify-center">
          <h2>Add contract</h2>
          <InputDropdown
            label="Contract Type:"
            placeholder="Choose contract type"
            values={contractTypes}
            setValue={(contractType) => setData({ ...data, contractType })}
          />
          <SongAddition song={data.song} selectSong={handleSongSelection} />
          <div className="flex flex-row justify-end gap-[8px]">
            <Button text="Cancel" onClick={() => handleModal(false)} />
            <Button text="Next" color="dark" onClick={() => setModalStep(ModalStep.dates)} />
          </div>
        </div>
      )}
      {modalStep === ModalStep.dates && (
        <ContractDates handleModal={handleModal} setModalStep={setModalStep} />
      )}
      {modalStep === ModalStep.userInfo && (
        <UserInfo handleModal={handleModal} setModalStep={setModalStep} />
      )}
    </div>
  );
};
