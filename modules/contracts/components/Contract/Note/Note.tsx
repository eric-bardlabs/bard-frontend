import { EditIcon } from '@/components/Icons';
import { Button, Input } from '@/components/uikit';
import { useState } from 'react';

export const Note = () => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [note, setNote] = useState({
    reminder: '01/06/2023',
    note: 'Keep an eye on this contract. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sedo eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quisnostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  });

  const handleMode = (edit: boolean) => {
    setIsEdit(edit);
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-row justify-between">
        <h2>Notes</h2>
        {isEdit && (
          <div className="flex flex-row gap-[8px] justify-end mt-[24px]">
            <Button color="light" text="Cancel" onClick={() => handleMode(false)} />
            <Button color="dark" text="Save" onClick={() => handleMode(false)} />
          </div>
        )}
        {!isEdit && (
          <div className="cursor-pointer" onClick={() => handleMode(true)}>
            <EditIcon firstColor="#494F55" width="24" height="24" />
          </div>
        )}
      </div>

      {isEdit ? (
        <>
          <Input
            type="text"
            label="Reminder date"
            value={note.reminder}
            setValue={(value) => setNote({ ...note, reminder: value })}
          />
          <Input
            type="text"
            label="Notes"
            value={note.note}
            setValue={(value) => setNote({ ...note, note: value })}
          />
        </>
      ) : (
        <>
          <div>Reminder: {note.reminder}</div>
          <p>{note.note}</p>
        </>
      )}

      {isEdit && (
        <div className="flex flex-row gap-[8px] justify-end mt-[24px]">
          <Button color="light" text="Cancel" onClick={() => handleMode(false)} />
          <Button color="dark" text="Save" onClick={() => handleMode(false)} />
        </div>
      )}
    </div>
  );
};
