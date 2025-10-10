import Logo from '@/components/ui/Logo';

interface Props {
  artistName: string;
  isOpen: boolean;
  handleOpen: () => void;
}

export const Header = ({ artistName, isOpen, handleOpen }: Props) => {
  return (
    <div className='flex flex-row justify-between w-full md:max-w-[240px] md:justify-start items-center gap-[16px] bg-dark p-[16px] z-20 bg-slate-950 fixed'>
      <Logo />
    </div>
  );
};
