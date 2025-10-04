import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Menu, XIcon } from 'lucide-react';

interface Props {
  artistName: string;
  isOpen: boolean;
  handleOpen: () => void;
}

export const Header = ({ artistName, isOpen, handleOpen }: Props) => {
  return (
    <div className='flex flex-row justify-between w-full md:max-w-[240px] md:justify-start items-center gap-[16px] bg-dark p-[16px] z-20 bg-slate-950 fixed'>
      <Logo />
      <Button
        className={` p-2 text-white md:hidden focus:outline-none`}
        onClick={handleOpen}
      >
        {isOpen ? <XIcon /> : <Menu />}
      </Button>
    </div>
  );
};
