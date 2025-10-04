import React from 'react';

interface Props {
  firstColor?: string;
  secondColor?: string;
  width?: string;
  height?: string;
}

export const UsersIcon = ({ firstColor, secondColor, width = '16', height = '16' }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[65px] max-h-[65px] md:max-w-[86px] md:max-h-[86px]"
    >
      <g id="users">
        <path
          id="Vector"
          d="M11.3332 14V12.6667C11.3332 11.9594 11.0522 11.2811 10.5521 10.781C10.052 10.281 9.37375 10 8.6665 10H3.33317C2.62593 10 1.94765 10.281 1.44755 10.781C0.947456 11.2811 0.666504 11.9594 0.666504 12.6667V14"
          stroke={firstColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M6.00016 7.33333C7.47292 7.33333 8.66683 6.13943 8.66683 4.66667C8.66683 3.19391 7.47292 2 6.00016 2C4.5274 2 3.3335 3.19391 3.3335 4.66667C3.3335 6.13943 4.5274 7.33333 6.00016 7.33333Z"
          stroke={firstColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_3"
          d="M15.3335 13.9998V12.6664C15.3331 12.0756 15.1364 11.5016 14.7744 11.0346C14.4124 10.5677 13.9056 10.2341 13.3335 10.0864"
          stroke={secondColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_4"
          d="M10.6665 2.08643C11.2401 2.23329 11.7485 2.56689 12.1116 3.03463C12.4747 3.50237 12.6717 4.07765 12.6717 4.66976C12.6717 5.26187 12.4747 5.83715 12.1116 6.30488C11.7485 6.77262 11.2401 7.10622 10.6665 7.25309"
          stroke={secondColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
