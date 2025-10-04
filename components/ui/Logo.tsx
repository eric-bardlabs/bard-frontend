/* eslint-disable @next/next/no-img-element */
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const Logo = () => {
  return (
    <Link href="/home">
      <div
        className={`flex flex-row items-center gap-4 ${spaceGrotesk.className}`}
      >
        <img src="/logo.svg" alt="Logo" width={40} height={41} />
        <div className="text-2xl font-medium text-white">Bard Labs</div>
      </div>
    </Link>
  );
};

export default Logo;
