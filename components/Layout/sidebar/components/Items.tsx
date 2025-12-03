"use client";
import { useClerk } from "@clerk/nextjs";

import {
  Disc,
  Home,
  LogOut,
  LucideIcon,
  GroupIcon,
  UserRound,
  Users,
  Calendar,
  Settings,
  Guitar,
  Sparkles,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrganizationSwitcher, useOrganization } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface Props {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export enum Pages {
  songs = "Songs",
  collaborators = "Collaborators",
  earnings = "Earnings",
  calendar = "Calendar",
  profile = "Profile",
  account = "Account",
  logOut = "Log Out",
  organizations = "Organizations",
  home = "Home",
  sessions = "Sessions",
  chat = "Melody",
  financials = "Financials",
}

const SidebarLinkItem = ({
  path,
  label,
  Icon,
  toggleSidebar,
  rightBadge,
}: {
  path: string;
  label: string;
  Icon: LucideIcon;
  rightBadge?: React.ReactNode;
  toggleSidebar: () => void;
}) => {
  const pathname = usePathname();
  return (
    <Link
      href={path}
      className={`flex flex-row items-center gap-4 py-[10px] px-2 ${
        pathname === path && "font-bold"
      } text-white hover:bg-slate-800 rounded`}
      onClick={() => toggleSidebar()}
      prefetch
    >
      <Icon size={20} />
      {label}
      {rightBadge && rightBadge}
    </Link>
  );
};

export const Items = ({ isOpen, toggleSidebar }: Props) => {
  const pathname = usePathname();

  const router = useRouter();
  const { signOut } = useClerk();

  const { organization } = useOrganization();
  const anyOrganizationSelected = Boolean(organization);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <div
        className={`${
          isOpen ? "h-auto" : "h-0"
        } md:block fixed w-full mt-[72px] md:max-w-[240px] md:h-full bg-dark overflow-y-hidden z-50 transition-all duration-300 ease-in-out md:transition-none`}
      >
        <ul className="flex flex-col md:h-[calc(100%-72px)] gap-[16px] p-[16px] text-grayLight md:gap-2 bg-slate-950">
        <OrganizationSwitcher
          hidePersonal={false}
          afterSelectOrganizationUrl={pathname ?? process.env.HOST}
          appearance={{
            baseTheme: dark,
          }}
        />

        <div className="flex flex-col flex-1 gap-[16px] justify-between mt-2">
          <div className="flex flex-col xs:gap-[16px] md:gap-2">
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/home"
                  label={Pages.home}
                  Icon={Home}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/songs"
                  label={Pages.songs}
                  Icon={Disc}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/collaborators"
                  label={Pages.collaborators}
                  Icon={Users}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/calendar"
                  label={Pages.calendar}
                  Icon={Calendar}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/sessions"
                  label={Pages.sessions}
                  Icon={Guitar}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/chat"
                  label={Pages.chat}
                  Icon={Sparkles}
                  toggleSidebar={toggleSidebar}
                  rightBadge={
                    <span className="text-xs bg-gradient-to-r from-purple-400 to-blue-400 text-white px-1.5 py-0.5 rounded-full">
                      AI
                    </span>
                  }
                />
              </li>
            )}
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/financials"
                  label={Pages.financials}
                  Icon={DollarSign}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            <li>
              <SidebarLinkItem
                path="/profile"
                label={Pages.profile}
                Icon={UserRound}
                toggleSidebar={toggleSidebar}
              />
            </li>
            {anyOrganizationSelected && (
              <li>
                <SidebarLinkItem
                  path="/organizations"
                  label={Pages.organizations}
                  Icon={GroupIcon}
                  toggleSidebar={toggleSidebar}
                />
              </li>
            )}
            <li>
              <SidebarLinkItem
                path="/account"
                label={Pages.account}
                Icon={Settings}
                toggleSidebar={toggleSidebar}
              />
            </li>
            <li>
              <div
                className="flex flex-row items-center gap-4 py-[10px] px-2 text-white hover:bg-slate-800 rounded cursor-pointer"
                onClick={() =>
                  signOut().then(() => {
                    router.push("/");
                  })
                }
              >
                <LogOut size={20} />
                {Pages.logOut}
              </div>
            </li>
          </div>
          <div className="flex flex-col xs:gap-[16px] md:gap-4"></div>
        </div>
      </ul>
    </div>
    </>
  );
};
