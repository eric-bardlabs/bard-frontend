import React from 'react';
import Image from 'next/image';

interface Props {
  text: string;
  color?: 'light' | 'dark';
  add?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button = ({ onClick, text, color = 'light', add = false }: Props) => {
  return (
    <button
      className={`flex flex-row justify-center xs:w-full sm:max-w-[160px] md:max-w-fit md:min-w-[86px] gap-button text-base max-h-fit ${
        color === 'light'
          ? 'bg-white text-dark hover:bg-[#f0f3f5]'
          : 'bg-dark text-white hover:bg-grayDark'
      } transition-bg duration-200 leading-base px-buttonX py-buttonY border border-dark rounded`}
      onClick={onClick}
    >
      {add && (
        <Image
          src={`${color === 'light' ? '/plus-dark.svg' : '/plus-light.svg'}`}
          alt="plus-icon"
          width={16}
          height={16}
        />
      )}
      {text}
    </button>
  );
};
