import React from 'react';

interface Props {
  name: string;
  value: string;
  checked: boolean;
  labelFor: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RadioButton = ({ name, value, checked, labelFor, onChange }: Props) => {
  return (
    <div className="flex items-center my-[12px]">
      <input
        id={labelFor}
        type="radio"
        value={value}
        onChange={onChange}
        checked={checked}
        name={name}
        className="w-4 h-4 text-info bg-gray-100 border-gray-300 focus:ring-info-500 focus:ring-2"
      />
      <label
        htmlFor={labelFor}
        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
      >
        {value}
      </label>
    </div>
  );
};
