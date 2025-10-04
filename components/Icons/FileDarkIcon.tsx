import React from 'react';

interface Props {
  firstColor?: string;
  secondColor?: string;
  width?: string;
  height?: string;
}

export const FileDarkIcon = ({ firstColor, secondColor, width = '16', height = '16' }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="file-dark">
        <path
          id="Vector"
          d="M9.33301 1.33301V5.33301H13.333"
          stroke={firstColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M9.33341 1.3335H4.00008C3.64646 1.3335 3.30732 1.47397 3.05727 1.72402C2.80722 1.97407 2.66675 2.31321 2.66675 2.66683V13.3335C2.66675 13.6871 2.80722 14.0263 3.05727 14.2763C3.30732 14.5264 3.64646 14.6668 4.00008 14.6668H12.0001C12.3537 14.6668 12.6928 14.5264 12.9429 14.2763C13.1929 14.0263 13.3334 13.6871 13.3334 13.3335V5.3335L9.33341 1.3335Z"
          stroke={firstColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_3"
          d="M10.6663 8.66699H5.33301"
          stroke={secondColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_4"
          d="M10.6663 11.333H5.33301"
          stroke={secondColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_5"
          d="M6.66634 6H5.99967H5.33301"
          stroke={secondColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
