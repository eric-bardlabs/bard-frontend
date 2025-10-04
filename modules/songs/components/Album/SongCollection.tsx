import { Accordion } from '@radix-ui/react-accordion';

export const SongCollection = ({
  openedCollections,
  children,
}: {
  openedCollections: string[];
  children: React.ReactNode;
}) => {
  return (
    <Accordion type='multiple' value={openedCollections}>
      {children}
    </Accordion>
  );
};
