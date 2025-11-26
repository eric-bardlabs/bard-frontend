"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Spinner,
  DateRangePicker,
} from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { RangeValue } from "@react-types/shared";
import { useAuth } from "@clerk/nextjs";
import { fetchFinancialData } from "@/lib/api/financials";

const sourceOptions = [
  { key: "", label: "All Sources" },
  { key: "vydia", label: "Vydia" },
  { key: "cmdshift", label: "CmdShift" },
  { key: "distrokid", label: "DistroKid" },
  { key: "tunecore", label: "TuneCore" },
  { key: "cdbaby", label: "CD Baby" },
  { key: "amuse", label: "Amuse" },
  { key: "ditto", label: "Ditto Music" },
];

const dspOptions = [
  { key: "", label: "All DSPs" },
  { key: "spotify", label: "Spotify" },
  { key: "apple", label: "Apple Music" },
  { key: "youtube", label: "YouTube Music" },
  { key: "amazon", label: "Amazon Music" },
  { key: "itunes", label: "iTunes Store" },
  { key: "tidal", label: "Tidal" },
];

const typeOptions = [
  { key: "", label: "All Types" },
  { key: "streaming", label: "Streaming" },
  { key: "download", label: "Download" },
];

interface FinancialRecord {
  id: string;
  isrc?: string;
  source?: string;
  dsp?: string;
  type?: string;
  amount?: number;
  year: number;
  month: number;
  artist_share?: number;
  distro_share?: number;
  media_type?: string;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
}

interface FinancialDataResponse {
  data: FinancialRecord[];
  total_count: number;
  total_amount: number;
}

type SortColumn = "period" | "isrc" | "source" | "dsp" | "type" | "media_type" | "quantity" | "amount" | "artist_share" | "distro_share";
type SortDirection = "asc" | "desc";

export default function FinancialsPage() {
  const { getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new CalendarDate(2024, 1, 1),
    end: new CalendarDate(2025, 12, 31),
  });
  const [source, setSource] = useState<string>("");
  const [dsp, setDsp] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("period");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, isLoading, error } = useQuery<FinancialDataResponse>({
    queryKey: [
      "financials",
      page,
      dateRange,
      source,
      dsp,
      type,
      sortColumn,
      sortDirection,
    ],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      const result = await fetchFinancialData({
        token: token!,
        startYear: dateRange.start?.year,
        startMonth: dateRange.start?.month,
        endYear: dateRange.end?.year,
        endMonth: dateRange.end?.month,
        source: source || undefined,
        dsp: dsp || undefined,
        type: type || undefined,
        offset,
        limit,
      });
      
      // Client-side sorting
      if (result.data) {
        result.data.sort((a, b) => {
          let valueA: any, valueB: any;
          
          switch (sortColumn) {
            case "period":
              valueA = a.year * 100 + a.month;
              valueB = b.year * 100 + b.month;
              break;
            case "amount":
              valueA = a.amount || 0;
              valueB = b.amount || 0;
              break;
            case "quantity":
              valueA = a.quantity || 0;
              valueB = b.quantity || 0;
              break;
            case "artist_share":
              valueA = a.artist_share || 0;
              valueB = b.artist_share || 0;
              break;
            case "distro_share":
              valueA = a.distro_share || 0;
              valueB = b.distro_share || 0;
              break;
            default:
              valueA = a[sortColumn] || "";
              valueB = b[sortColumn] || "";
          }
          
          if (sortDirection === "asc") {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
          } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
          }
        });
      }
      
      return result;
    },
  });

  const handleDateRangeChange = (value: RangeValue<CalendarDate> | null) => {
    if (value?.start && value?.end) {
      setDateRange({ start: value.start, end: value.end });
    }
    setPage(1);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const totalPages = data ? Math.ceil(data.total_count / limit) : 1;

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Data</h1>
        {data && (
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Total Records: {data.total_count.toLocaleString()}
            </p>
            <p className="text-lg font-semibold">
              Total Amount: {formatCurrency(data.total_amount)}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <DateRangePicker
                label="Date Range"
                value={dateRange}
                onChange={handleDateRangeChange}
                variant="bordered"
                granularity="day"
              />
            </div>
            <Select
              label="Source"
              placeholder="Select source"
              selectedKeys={[source]}
              onSelectionChange={(keys) => {
                setSource(Array.from(keys)[0] as string);
                setPage(1);
              }}
              variant="bordered"
            >
              {sourceOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="DSP"
              placeholder="Select DSP"
              selectedKeys={[dsp]}
              onSelectionChange={(keys) => {
                setDsp(Array.from(keys)[0] as string);
                setPage(1);
              }}
              variant="bordered"
            >
              {dspOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Type"
              placeholder="Select type"
              selectedKeys={[type]}
              onSelectionChange={(keys) => {
                setType(Array.from(keys)[0] as string);
                setPage(1);
              }}
              variant="bordered"
            >
              {typeOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              Error loading financial data
            </div>
          ) : (
            <Table 
              aria-label="Financial data table" 
              removeWrapper
              classNames={{
                th: "bg-default-100 text-default-700 font-semibold",
                td: "py-3",
                table: "min-h-[400px]",
                wrapper: "shadow-none",
              }}
            >
              <TableHeader>
                <TableColumn 
                  key="period"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("period")}
                >
                  <div className="flex items-center gap-2">
                    PERIOD {getSortIndicator("period")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="isrc"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("isrc")}
                >
                  <div className="flex items-center gap-2">
                    ISRC {getSortIndicator("isrc")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="source"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("source")}
                >
                  <div className="flex items-center gap-2">
                    SOURCE {getSortIndicator("source")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="dsp"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("dsp")}
                >
                  <div className="flex items-center gap-2">
                    DSP {getSortIndicator("dsp")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="type"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center gap-2">
                    TYPE {getSortIndicator("type")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="media_type"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("media_type")}
                >
                  <div className="flex items-center gap-2">
                    MEDIA TYPE {getSortIndicator("media_type")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="quantity"
                  align="end"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center justify-end gap-2">
                    QUANTITY {getSortIndicator("quantity")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="amount"
                  align="end"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    AMOUNT {getSortIndicator("amount")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="artist_share"
                  align="end"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("artist_share")}
                >
                  <div className="flex items-center justify-end gap-2">
                    ARTIST SHARE {getSortIndicator("artist_share")}
                  </div>
                </TableColumn>
                <TableColumn 
                  key="distro_share"
                  align="end"
                  allowsSorting
                  className="cursor-pointer"
                  onClick={() => handleSort("distro_share")}
                >
                  <div className="flex items-center justify-end gap-2">
                    DISTRO SHARE {getSortIndicator("distro_share")}
                  </div>
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="No financial data found">
                {data?.data.map((record) => (
                  <TableRow key={record.id} className="hover:bg-default-50">
                    <TableCell className="font-medium">
                      {formatDate(record.year, record.month)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-default-100 px-2 py-1 rounded">
                        {record.isrc || "N/A"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {record.source || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {record.dsp || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {record.type || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {record.media_type || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.quantity?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercentage(record.artist_share)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercentage(record.distro_share)}
                    </TableCell>
                  </TableRow>
                )) ?? []}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {data && data.total_count > 0 && (
        <div className="flex justify-center items-center gap-4">
          <div className="text-small text-default-500">
            Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data.total_count)} of {data.total_count.toLocaleString()} entries
          </div>
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            size="sm"
            variant="bordered"
            color="primary"
            classNames={{
              wrapper: "gap-0 overflow-visible h-8",
              item: "w-8 h-8 text-small",
              cursor: "bg-gradient-to-b from-default-500 to-default-800 dark:from-default-300 dark:to-default-600 text-white font-bold",
            }}
          />
        </div>
      )}
    </div>
  );
}