"use client";

import { useParams } from "next/navigation";
import AlbumFinancialView from "@/components/financials/AlbumFinancialView";

export default function AlbumFinancialPage() {
  const params = useParams();
  const upc = params.upc as string;

  return <AlbumFinancialView upc={upc} />;
}