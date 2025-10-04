import React from 'react';

interface Props {
  firstColor?: string;
  secondColor?: string;
  width?: string;
  height?: string;
}

export const ArrowIcon = ({ firstColor, secondColor, width = '16', height = '16' }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 15L12 9L6 15"
        stroke={firstColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
