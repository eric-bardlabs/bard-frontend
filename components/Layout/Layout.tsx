"use client";
import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface Props {
  children: ReactNode;
}

export const Layout = ({ children }: Props) => {
  return (
    <>
      <div className="flex flex-col md:flex-row h-full">
        <Sidebar />
        <main className="h-full w-full min-w-0 md:p-[16px] md:mt-0 pt-[72px] md:pt-0">
          {children}
        </main>
      </div>
    </>
  );
};
