import { SVGProps } from 'react';

export const Icons = {
  AppleMusic: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      aria-label='Apple Music'
      role='img'
      viewBox='0 0 512 512'
      {...props}
    >
      <rect width={512} height={512} rx='15%' fill='url(#g)' />
      <linearGradient id='g' x1={0.5} y1={0.99} x2={0.5} y2={0.02}>
        <stop offset={0} stopColor='#FA233B' />
        <stop offset={1} stopColor='#FB5C74' />
      </linearGradient>
      <path
        fill='#ffffff'
        d='M199 359V199q0-9 10-11l138-28q11-2 12 10v122q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69V88s0-20-17-15l-170 35s-13 2-13 18v203q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69'
      />
    </svg>
  ),
  SpotifyMusic: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      aria-label='Spotify'
      role='img'
      viewBox='0 0 512 512'
      {...props}
    >
      <rect width={512} height={512} rx='15%' fill='#3bd75f' />
      <circle cx={256} cy={256} fill='#ffffff' r={192} />
      <g fill='none' stroke='#3bd75f' strokeLinecap='round'>
        <path d='m141 195c75-20 164-15 238 24' strokeWidth={36} />
        <path d='m152 257c61-17 144-13 203 24' strokeWidth={31} />
        <path d='m156 315c54-12 116-17 178 20' strokeWidth={24} />
      </g>
    </svg>
  ),
};
