import React, { useState } from 'react';
import { Button, Checkbox, Input } from '@/components/uikit';
import { CollaboratorAddition } from './CollaboratorAddition/CollaboratorAddition';
import { AddSong } from '../ModalContent';
import DatePicker from 'react-multi-date-picker';
import type { Value } from 'react-multi-date-picker';

interface Props {
  cancelManualAddition: (arg: AddSong | null) => void;
}

export const ManualSongAddition = ({ cancelManualAddition }: Props) => {
  const [songData, setSongData] = useState({
    title: '',
    published: false,
    releaseDate: new Date(),
  });
  const [addCollaboratorModal, setAddCollaboratorModal] = useState<boolean>(false);
  const [date, setDate] = useState<Value>(new Date());

  const datePickerStyles = {
    height: '40px',
    borderRadius: '4px',
    borderColor: '#d7dfe4',
    cursor: 'pointer',
  };

  return (
    <>
      {!addCollaboratorModal ? (
        <div className="flex flex-col h-full xs:w-[210px] md:w-[400px]">
          <h2>Fill in info below:</h2>
          <div className="flex flex-col gap-[15px] h-full mt-[20px]">
            <Input
              type="text"
              label="Title"
              labelFor="Song Title"
              placeholder="Enter title"
              value={songData.title}
              setValue={(title) => setSongData({ ...songData, title })}
              required
            />
            {/* <Checkbox label="Is the song published?" /> */}
            <div className="flex flex-col gap-labelInput">
              <label className="text-[15px] text-grayDark">Release Date</label>
              <DatePicker
                value={date}
                onChange={setDate}
                format="DD.MM.YYYY"
                style={datePickerStyles}
              />
            </div>
            <div
              className="flex flex-row gap-[10px] items-center cursor-pointer hover:text-gray"
              onClick={() => setAddCollaboratorModal(true)}
            >
              + Add collaborator
            </div>
            <div className="flex flex-row gap-[8px] justify-end">
              <Button text="Back" color="light" onClick={() => cancelManualAddition(null)} />
              <Button text="Submit" color="dark" />
            </div>
          </div>
        </div>
      ) : (
        <CollaboratorAddition cancelCollaboratorAddition={setAddCollaboratorModal} />
      )}
    </>
  );
};
