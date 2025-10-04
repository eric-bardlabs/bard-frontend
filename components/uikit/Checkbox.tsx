import React, { useState } from 'react';

interface Props {
  label: string;
  value: boolean;
  check: (arg: boolean) => void;
}

export const Checkbox = ({ value, check, label }: Props) => {
  const [isChecked, setIsChecked] = useState(value);

  return (
    <div>
      <label className="flex gap-[10px]">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(value) => {
            setIsChecked((prev) => !prev);
            check(!value);
          }}
        />
        <span>{label}</span>
      </label>
      {/* <p>{isChecked ? 'Selected' : 'Unchecked'}</p> */}
    </div>
  );
};
