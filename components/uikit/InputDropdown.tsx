import React from 'react';

interface Props {
  label?: string;
  labelFor?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  values: string[];
  setValue: (arg: string) => void;
}

export const InputDropdown = ({
  label,
  labelFor,
  placeholder,
  required,
  disabled,
  values,
  setValue,
}: Props) => {
  return (
    <div className="flex flex-col gap-labelInput">
      {label && (
        <label className="text-[15px] text-grayDark" htmlFor={labelFor}>
          {label}
        </label>
      )}
      <select
        id={labelFor}
        // value={placeholder}
        className={`${
          disabled ? 'text-gray' : 'text-dark'
        } bg-white font-[400] px-inputX border border-grayLight rounded h-input`}
        disabled={disabled}
        required={required}
        onChange={(event) => setValue && setValue(event.target.value)}
      >
        <option selected>{placeholder}</option>
        {values.map((value) => (
          <option value={value} key={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
};
