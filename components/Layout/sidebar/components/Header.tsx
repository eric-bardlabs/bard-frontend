import Logo from '@/components/ui/Logo';
import { Menu } from 'lucide-react';

interface Props {
  toggleSidebar?: () => void;
}

export const Header = ({ toggleSidebar }: Props) => {
  return (
    <div className='flex flex-row justify-between w-full md:max-w-[240px] md:justify-start items-center gap-[16px] bg-dark p-[16px] z-20 bg-slate-950 fixed'>
      <Logo />
      {toggleSidebar && (
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-white hover:bg-slate-800 p-2 rounded"
          aria-label="Toggle navigation"
        >
          <Menu size={24} />
        </button>
      )}
    </div>
  );
};
