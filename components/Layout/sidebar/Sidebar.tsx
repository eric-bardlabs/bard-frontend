"use client";
import { Header, Items } from "@/components/Layout/sidebar";
import clsx from "clsx";
import { useState } from "react";
import { useUserContext } from "@/components/UserContext";

export const Sidebar = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { user, isLoading } = useUserContext();

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <div
      className={clsx(
        user?.initial_step && "hidden",
        "flex flex-1 md:flex-none flex-col w-full md:max-w-[240px] h-full top-0 bg-slate-950 transition-all"
      )}
    >
      <Header />
      <Items isOpen={open} toggleSidebar={toggleSidebar} />
    </div>
  );
};
