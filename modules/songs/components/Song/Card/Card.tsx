import { ArrowIcon } from '@/components/Icons';
import Image from 'next/image';

const Card = ({ number = '$5,000,000', text = 'Total revenue' }) => {
  return (
    <div className="flex flex-row justify-between p-[16px] border border-grayLight rounded xs:min-w-full md:min-w-[340px] cursor-pointer">
      <div className="flex flex-row gap-[16px]">
        <Image
          src={'/artist.svg'}
          alt="Song picture"
          width={48}
          height={48}
          className="rounded-full"
        />
        <div className="flex flex-col gap-[8px]">
          <h3>{number}</h3>
          <div>{text}</div>
        </div>
      </div>
      <div className="flex flex-col justify-center cursor-pointer rotate-90">
        <ArrowIcon height="24" width="24" firstColor="#181B1E" />
      </div>
    </div>
  );
};

export default Card;
