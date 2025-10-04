import React from 'react';

interface Props {
  firstColor?: string;
  secondColor?: string;
  width?: string;
  height?: string;
}

export const FileIcon = ({ firstColor, secondColor, width = '16', height = '16' }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[65px] max-h-[65px] md:max-w-[86px] md:max-h-[86px]"
    >
      <g id="file">
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
          d="M9.33317 1.3335H3.99984C3.64622 1.3335 3.30708 1.47397 3.05703 1.72402C2.80698 1.97407 2.6665 2.31321 2.6665 2.66683V13.3335C2.6665 13.6871 2.80698 14.0263 3.05703 14.2763C3.30708 14.5264 3.64622 14.6668 3.99984 14.6668H11.9998C12.3535 14.6668 12.6926 14.5264 12.9426 14.2763C13.1927 14.0263 13.3332 13.6871 13.3332 13.3335V5.3335L9.33317 1.3335Z"
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
