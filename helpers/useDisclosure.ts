import { useEffect, useState } from "react";

type Props =
  | {
      initialState?: boolean;
      onOpen?: () => void;
      onClose?: () => void;
    }
  | undefined;
export const useDisclosure = (props: Props) => {
  const { initialState, onOpen, onClose } = props ?? {
    initialState: false,
    onOpen: undefined,
    onClose: undefined,
  };
  const [isOpen, setIsOpen] = useState(initialState);

  useEffect(() => {
    if (isOpen !== initialState) {
      setIsOpen(initialState);
    }
  }, [initialState]);

  const open = () => {
    setIsOpen(true);
    if (typeof onOpen === "function") {
      onOpen();
    }
  };

  const close = () => {
    setIsOpen(false);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const toggle = () => (isOpen ? close() : open());

  return { isOpen, open, close, toggle };
};
