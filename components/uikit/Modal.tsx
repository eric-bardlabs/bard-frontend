import { CloseIcon } from '@/components/Icons';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  handleModal: (arg: boolean) => void;
}

export const Modal = ({ children, handleModal }: Props) => {
  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full bg-neutral-200 z-0 top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
      <div className="darkBG" onClick={() => handleModal(false)} />
      <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-[24px] m-auto shadow-[0_0_8px_0px_rgba(24,27,30,0.25)] xs:p-[20px] md:min-h-[300px] md:p-[40px] bg-white z-100">
        <div
          className="absolute top-[18px] right-[18px] cursor-pointer"
          onClick={() => handleModal(false)}
        >
          <CloseIcon firstColor="#181B1E" secondColor="#181B1E" width="24" height="24" />
        </div>
        {children}
      </div>
    </>
  );
};
