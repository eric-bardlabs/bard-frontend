import Logo from '@/components/ui/Logo';

export const Header = () => {
  return (
    <div className='flex flex-row justify-between w-full md:max-w-[240px] md:justify-start items-center gap-[16px] bg-dark p-[16px] z-20 bg-slate-950 fixed'>
      <Logo />
    </div>
  );
};
