import { Input } from '@/components/uikit';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';

interface Props {
  platform: string;
  id: number;
  isEdit: boolean;
}

export const Platform = ({ platform, isEdit }: Props) => {
  const iconColours = {
    first: '#181B1E', // darker
    second: '#494F55',
  };

  const { first, second } = iconColours;

  return (
    <div
      className={`flex ${
        isEdit ? 'flex-col gap-[24px] py-[24px]' : 'flex-row justify-between items-center py-[12px]'
      } border-b border-grayLight`}
    >
      <h4>{platform}</h4>
      {isEdit ? (
        <Input type="text" label="Website" value="value" />
      ) : (
        <div className="flex flex-row gap-[16px]">
          {/* <div className="px-[8px] py-[10px] bg-ultraLight border border-ultraLight rounded cursor-pointer">
            <FileDarkIcon firstColor={first} secondColor={second} />
          </div>
          <div className="py-[10px] px-[8px] bg-ultraLight border border-ultraLight rounded cursor-pointer">
            <GlobeIcon firstColor={first} />
          </div> */}
          <div data-tooltip-id="platform-actions" className="cursor-pointer">
            . . .
          </div>
          <Tooltip id="platform-actions" openOnClick clickable>
            <div>
              <h3>This is a very interesting header</h3>
              <p>Here's some interesting stuff:</p>
              <ul>
                <button>Some</button>
                <Link href="/songs">Interesting</Link>
                <li>Stuff</li>
              </ul>
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
