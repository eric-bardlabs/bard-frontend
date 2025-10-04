import React from 'react';

interface Props {
  type: string;
  label?: string; // text above input as type/description
  labelFor?: string;
  placeholder?: string;
  // maxWidth?: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  setValue?: (arg: string) => void;
}

export const Input = ({
  type,
  label,
  labelFor,
  placeholder,
  // maxWidth,
  required = false,
  disabled = false,
  value,
  setValue,
}: Props) => {
  return (
    <div className="flex flex-col gap-labelInput">
      {label && (
        <label className="text-[15px] text-grayDark" htmlFor={labelFor}>
          {label}
        </label>
      )}
      <input
        className={`${
          disabled ? 'text-gray' : 'text-dark'
        } font-[400] px-inputX border border-grayLight rounded h-input focus:outline-none`}
        type={type}
        id={labelFor}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => setValue && setValue(event.target.value)}
      />
    </div>
  );
};
