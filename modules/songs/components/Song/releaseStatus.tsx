import { Chip } from '@heroui/react';

export const ReleaseStatus = (props: { releaseDate?: Date }) => {
  if (props.releaseDate) {
    return (
      <Chip color='success' size='md' className='rounded-none'>
        Released
      </Chip>
    );
  } else {
    return (
      <Chip color='default' size='md' className='rounded-none'>
        Not Released
      </Chip>
    );
  }
};
