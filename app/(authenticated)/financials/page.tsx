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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
    start: new CalendarDate(2023, 1, 1),
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
    queryKey: ["financial-insights", dateRange, viewBy],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      return fetchFinancialInsights(
        token!,
        dateRange.start?.year,
        dateRange.start?.month,
        dateRange.end?.year,
        dateRange.end?.month,
        viewBy
      );
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
      ) : insightsData && (insightsData.top_songs.length > 0 || insightsData.top_months.length > 0 || insightsData.dsp_distribution.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Songs */}
          <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-success-800">Top Performing Songs</h3>
                  <p className="text-sm text-success-600">Revenue leaders in selected period</p>
                </div>
                <div className="bg-success-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                  Top 5
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-4">
                {insightsData.top_songs.map((song, index) => {
                  const maxRevenue = insightsData.top_songs[0]?.revenue || 1;
                  const percentage = (song.revenue / maxRevenue) * 100;
                  const isTopPerformer = index === 0;
                  
                  return (
                    <div key={song.isrc} className={`p-3 rounded-lg border ${
                      isTopPerformer 
                        ? 'bg-white border-success-300 shadow-sm' 
                        : 'bg-success-25 border-success-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            isTopPerformer 
                              ? 'bg-success-500 text-white' 
                              : 'bg-success-200 text-success-700'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground text-sm truncate">
                              {song.song_name || `ISRC: ${song.isrc}`}
                            </div>
                            {song.album_name && (
                              <div className="text-xs text-default-500 truncate">
                                Album: {song.album_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success-700 text-lg">
                            {formatCurrency(song.revenue)}
                          </div>
                          {song.spotify_url && (
                            <a
                              href={song.spotify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              <span>Listen</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-default-600">
                          <span>Performance vs #1</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                          color="success"
                          classNames={{
                            track: "bg-success-100",
                            indicator: isTopPerformer ? "bg-success-500" : "bg-success-400"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {insightsData.top_songs.length === 0 && (
                <div className="text-center py-8 text-default-500">
                  <div className="text-lg mb-2">📊</div>
                  <p>No revenue data available for the selected period</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Revenue Trends */}
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-primary-800">Revenue Trends</h3>
                  <p className="text-sm text-primary-600">Highest earning months (by target date)</p>
                </div>
                <div className="bg-primary-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                  Monthly
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                {insightsData.top_months.map((month, index) => {
                  const maxRevenue = insightsData.top_months[0]?.revenue || 1;
                  const percentage = (month.revenue / maxRevenue) * 100;
                  const isPeakMonth = index === 0;
                  
                  return (
                    <div key={`${month.payout_year}-${month.payout_month}`} className={`p-3 rounded-lg border ${
                      isPeakMonth 
                        ? 'bg-white border-primary-300 shadow-sm' 
                        : 'bg-primary-25 border-primary-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            isPeakMonth 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-primary-200 text-primary-700'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="font-semibold text-foreground">
                            {formatPeriod(month.payout_year, month.payout_month)}
                          </div>
                        </div>
                        <div className="font-bold text-primary-700 text-lg">
                          {formatCurrency(month.revenue)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-default-600">
                          <span>Performance vs peak</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                          color="primary"
                          classNames={{
                            track: "bg-primary-100",
                            indicator: isPeakMonth ? "bg-primary-500" : "bg-primary-400"
                          }}
                        />
                        
                        {/* Top 5 songs for this month */}
                        {month.top_songs && month.top_songs.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-primary-200">
                            <div className="text-xs font-medium text-primary-700 mb-2">
                              Top songs this month:
                            </div>
                            <div className="space-y-1">
                              {month.top_songs.map((song, songIndex) => (
                                <div key={song.isrc} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-primary-600 font-medium">
                                      {songIndex + 1}.
                                    </span>
                                    <span className="truncate text-default-700">
                                      {song.song_name || song.isrc}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <span className="text-primary-700 font-medium">
                                      {formatCurrency(song.revenue)}
                                    </span>
                                    {song.spotify_url && (
                                      <a
                                        href={song.spotify_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {insightsData.top_months.length === 0 && (
                <div className="text-center py-8 text-default-500">
                  <div className="text-lg mb-2">📈</div>
                  <p>No monthly data available</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* DSP Performance */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-purple-800">DSP Performance</h3>
                  <p className="text-sm text-purple-600">Platform revenue breakdown with earnings per stream</p>
                </div>
                <div className="bg-purple-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                  By Revenue
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                {insightsData.dsp_distribution
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((dsp, index) => {
                    const isTopDSP = index === 0;
                    const isTop3 = index < 3;
                    
                    return (
                      <div key={dsp.dsp} className={`p-4 rounded-lg border ${
                        isTopDSP 
                          ? 'bg-white border-purple-300 shadow-sm' 
                          : isTop3
                          ? 'bg-purple-25 border-purple-200'
                          : 'bg-purple-10 border-purple-150'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              isTopDSP 
                                ? 'bg-purple-500 text-white' 
                                : isTop3
                                ? 'bg-purple-300 text-purple-800'
                                : 'bg-purple-200 text-purple-700'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-lg capitalize">
                                {dsp.dsp}
                              </div>
                              <div className="text-sm text-purple-600">
                                {dsp.total_streams.toLocaleString()} streams
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-700 text-xl">
                              {formatCurrency(dsp.revenue)}
                            </div>
                            <div className="text-sm text-purple-600 font-medium">
                              {dsp.percentage.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Revenue Share</span>
                          <span className="text-sm font-semibold text-purple-700">
                            ${(dsp.earnings_per_stream * 1000).toFixed(3)} per 1,000 streams
                          </span>
                        </div>
                        
                        <Progress
                          value={dsp.percentage}
                          className="h-2"
                          color="secondary"
                          classNames={{
                            track: "bg-purple-100",
                            indicator: isTopDSP 
                              ? "bg-purple-500" 
                              : isTop3 
                              ? "bg-purple-400" 
                              : "bg-purple-300"
                          }}
                        />
                      </div>
                    );
                  })}
              </div>
              
              {insightsData.dsp_distribution.length === 0 && (
                <div className="text-center py-8 text-default-500">
                  <div className="text-lg mb-2">📱</div>
                  <p>No DSP data available for selected period</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Monthly Revenue Chart */}
      {insightsData && insightsData.monthly_chart && insightsData.monthly_chart.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Revenue Timeline</h3>
                <p className="text-sm text-slate-600">Monthly revenue trends in selected period</p>
              </div>
              <div className="bg-slate-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                {insightsData.monthly_chart.length} months
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={insightsData.monthly_chart.map((item) => ({
                    month: `${new Date(item.year, item.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${item.year}`,
                    revenue: item.revenue,
                    fullDate: `${item.year}-${item.month.toString().padStart(2, '0')}`
                  }))}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                      return `$${value.toFixed(0)}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ color: '#334155', fontWeight: 600 }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              {(() => {
                const revenues = insightsData.monthly_chart.map(m => m.revenue);
                const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
                const avgRevenue = totalRevenue / revenues.length;
                const maxRevenue = Math.max(...revenues);
                const minRevenue = Math.min(...revenues);
                
                return (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-700">
                        {formatCurrency(totalRevenue)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Total Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-700">
                        {formatCurrency(avgRevenue)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Average/Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(maxRevenue)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Best Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-500">
                        {formatCurrency(minRevenue)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Lowest Month</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardBody>
        </Card>
      )}

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