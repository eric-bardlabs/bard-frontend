"use client";
import { Header, Items } from "@/components/Layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { useState } from "react";

export const Sidebar = () => {
  const [open, setOpen] = useState<boolean>(false);

  const { data: user, isLoading } = useQuery({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
  });

  const toggleSidebar = () => {
    setOpen(!open);
  };

  const displayName = user?.displayName ?? "";

  return (
    <div
      className={clsx(
        user?.initialStep && "hidden",
        "flex flex-1 md:flex-none flex-col w-full md:max-w-[240px] h-full top-0 bg-slate-950 transition-all"
      )}
    >
      <Header
        artistName={displayName}
        isOpen={open}
        handleOpen={toggleSidebar}
      />
      <Items isOpen={open} toggleSidebar={toggleSidebar} />
    </div>
  );
};
