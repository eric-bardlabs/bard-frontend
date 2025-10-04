import { ArrowBackIcon } from "@/components/Icons";
import Link from "next/link";
import Card from "./Card/Card";
import Table from "./Table/Table";

export const Song = () => {
  return (
    <div className="flex flex-col gap-[40px] pt-4 sm:pt-0">
      <Link href="/songs">
        <ArrowBackIcon firstColor="#494F55" width="24" height="24" />
      </Link>
      <h1>Shea Butter Baby</h1>
      <div className="flex flex-row flex-wrap gap-[16px] md:mr-auto">
        <Card number="10,000,000" text="Total streams" />
        <Card number="$5,000,000" text="Total revenue" />
      </div>
      <Table />
    </div>
  );
};
