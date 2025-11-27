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
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  DateRangePicker,
  Chip,
  Button,
  Progress,
} from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { RangeValue } from "@react-types/shared";
import { useAuth } from "@clerk/nextjs";
import { fetchFinancialData, fetchFinancialInsights, InsightsResponse, FinancialDataResponse, FinancialDataItem } from "@/lib/api/financials";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

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

const viewByOptions = [
  { key: "target", label: "Reporting Month" },
  { key: "payout", label: "Payout Month" },
];

type SortColumn = "period" | "isrc" | "source" | "dsp" | "type" | "quantity" | "amount" | "artist_share" | "distro_share";
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
  const [viewBy, setViewBy] = useState<"target" | "payout">("target");
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
      viewBy,
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
        aggregatedBy: viewBy,
        offset,
        limit,
      });
      
      // Client-side sorting
      if (result.data) {
        result.data.sort((a, b) => {
          let valueA: any, valueB: any;
          
          switch (sortColumn) {
            case "period":
              valueA = a.payout_year * 100 + a.payout_month;
              valueB = b.payout_year * 100 + b.payout_month;
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

  // Fetch insights data from backend
  const { data: insightsData, isLoading: insightsLoading } = useQuery<InsightsResponse>({
    queryKey: ["financial-insights"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      return fetchFinancialInsights(token!);
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
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-default-400" />;
    }
    return sortDirection === "asc" ? 
      <ChevronUp className="w-4 h-4 text-primary" /> : 
      <ChevronDown className="w-4 h-4 text-primary" />;
  };

  const totalPages = data ? Math.ceil(data.total_count / limit) : 1;

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value?: number | null) => {
    if (value === undefined || value === null) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatPeriod = (year: number | null, month: number | null) => {
    if (year === null || month === null) return "N/A";
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "streaming":
        return "primary";
      case "download":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleSearch = () => {
    // Force refetch by updating a dependency
    setPage(1);
  };


  const totalAmount = data?.total_amount || 0;
  const totalCount = data?.total_count || 0;
  const dataRecords = data?.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Insights Cards */}
      {insightsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody className="flex justify-center items-center h-32">
                <Spinner size="md" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : insightsData && (insightsData.top_songs.length > 0 || insightsData.top_months.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Songs by Revenue */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Top Songs by Revenue</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {insightsData.top_songs.map((song, index) => {
                  const maxRevenue = insightsData.top_songs[0]?.revenue || 1;
                  const percentage = (song.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={song.isrc} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium truncate">
                          #{index + 1} {song.isrc}
                        </span>
                        <span className="text-success font-semibold">
                          {formatCurrency(song.revenue)}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        color="success"
                      />
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Top Months by Revenue */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Top Months by Revenue</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {insightsData.top_months.map((month, index) => {
                  const maxRevenue = insightsData.top_months[0]?.revenue || 1;
                  const percentage = (month.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={`${month.payout_year}-${month.payout_month}`} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">
                          #{index + 1} {formatPeriod(month.payout_year, month.payout_month)}
                        </span>
                        <span className="text-success font-semibold">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        color="primary"
                      />
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Revenue by Source for Top Songs */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Revenue by Source (Top 3 Songs)</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {insightsData.songs_by_source.map((song, songIndex) => (
                  <div key={song.isrc} className="space-y-2">
                    <div className="text-sm font-medium text-default-700 truncate">
                      #{songIndex + 1} {song.isrc}
                    </div>
                    <div className="space-y-1">
                      {song.sources.slice(0, 3).map((source) => {
                        const percentage = (source.revenue / song.total_revenue) * 100;
                        
                        return (
                          <div key={source.source} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="capitalize">{source.source}</span>
                              <span className="text-success">
                                {formatCurrency(source.revenue)}
                              </span>
                            </div>
                            <Progress
                              value={percentage}
                              className="h-1"
                              color="secondary"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Financial Information Search</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
            <div className="lg:col-span-2">
              <DateRangePicker
                label="Date Range"
                value={dateRange}
                onChange={handleDateRangeChange}
                variant="bordered"
                granularity="day"
              />
            </div>
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
              label="View by"
              placeholder="Select view"
              selectedKeys={[viewBy]}
              onSelectionChange={(keys) => {
                setViewBy(Array.from(keys)[0] as "target" | "payout");
                setPage(1);
              }}
              variant="bordered"
            >
              {viewByOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <div className="flex items-end">
              <Button
                color="primary"
                onPress={handleSearch}
                className="w-full"
              >
                Search
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-default-500">Total Results</p>
              <p className="text-2xl font-bold">{totalCount} statements</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Total Amount</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Financial Statements Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Financial Statements</h3>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table
              aria-label="Financial statements table"
              isStriped
              classNames={{
                base: "max-h-[520px] overflow-scroll",
                table: "min-h-[400px]",
              }}
            >
              <TableHeader>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("period")}
                >
                  <div className="flex items-center gap-2">
                    PERIOD
                    {getSortIndicator("period")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("isrc")}
                >
                  <div className="flex items-center gap-2">
                    ISRC
                    {getSortIndicator("isrc")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("source")}
                >
                  <div className="flex items-center gap-2">
                    SOURCE
                    {getSortIndicator("source")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("dsp")}
                >
                  <div className="flex items-center gap-2">
                    DSP
                    {getSortIndicator("dsp")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center gap-2">
                    TYPE
                    {getSortIndicator("type")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center gap-2">
                    QUANTITY
                    {getSortIndicator("quantity")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center gap-2">
                    AMOUNT
                    {getSortIndicator("amount")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("artist_share")}
                >
                  <div className="flex items-center gap-2">
                    ARTIST SHARE
                    {getSortIndicator("artist_share")}
                  </div>
                </TableColumn>
                <TableColumn 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleSort("distro_share")}
                >
                  <div className="flex items-center gap-2">
                    DISTRO SHARE
                    {getSortIndicator("distro_share")}
                  </div>
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="No financial data found">
                {dataRecords.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{formatPeriod(item.payout_year, item.payout_month)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{item.isrc || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.source || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.dsp || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getTypeColor(item.type || "")}
                        size="sm"
                        variant="flat"
                      >
                        {item.type || "N/A"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity?.toLocaleString() || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-success">
                        {formatCurrency(item.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatPercentage(item.artist_share)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatPercentage(item.distro_share)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
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