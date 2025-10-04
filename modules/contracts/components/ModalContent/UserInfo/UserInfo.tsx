import React, { useState } from 'react';
import { ModalStep } from '../ModalContent';
import { Button, Input } from '@/components/uikit';

interface Props {
  setModalStep: (arg: ModalStep) => void;
  handleModal: (arg: boolean) => void;
}

export const UserInfo = ({ handleModal, setModalStep }: Props) => {
  const [info, setInfo] = useState({
    composition: '',
    publisher: '',
    streaming: '',
    licensing: '',
  });

  return (
    <div className="flex flex-col gap-[16px] grow justify-center">
      <h2>Add user info</h2>
      <Input
        type="text"
        value={info.composition}
        placeholder="Enter Composition"
        label="Composition"
        setValue={(composition) => setInfo({ ...info, composition })}
      />
      <Input
        type="text"
        value={info.publisher}
        placeholder="Enter Publisher"
        label="Publisher"
        setValue={(publisher) => setInfo({ ...info, publisher })}
      />
      <Input
        type="text"
        value={info.streaming}
        placeholder="Streaming"
        label="Streaming"
        setValue={(streaming) => setInfo({ ...info, streaming })}
      />
      <Input
        type="text"
        value={info.licensing}
        placeholder="Enter User Lycensing"
        label="User Lycensing"
        setValue={(licensing) => setInfo({ ...info, licensing })}
      />
      <div className="flex flex-row justify-end gap-[8px]">
        <Button text="Back" onClick={() => setModalStep(ModalStep.dates)} />
        <Button text="Submit" color="dark" onClick={() => handleModal(false)} />
      </div>
    </div>
  );
};
