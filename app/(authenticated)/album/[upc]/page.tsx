"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { useAuth } from "@clerk/nextjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";

// We'll create this API function next
import { fetchAlbumFinancialData, AlbumFinancialResponse, RegionMonthlyBreakdown, DspMonthlyBreakdown } from "@/lib/api/financials";

// Monthly data tooltip component
function MonthlyDataTooltip({ 
  monthlyData, 
  type 
}: { 
  monthlyData: RegionMonthlyBreakdown[] | DspMonthlyBreakdown[]; 
  type: 'streams' | 'revenue';
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-4 w-80">
      <div className="text-sm font-semibold mb-3">
        Monthly {type === 'streams' ? 'Streams' : 'Revenue'} Trend
      </div>
      
      {monthlyData.length > 0 ? (
        <div>
          {/* Line Chart */}
          <div className="mb-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis 
                  dataKey="period"
                  stroke="#666"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  interval={Math.max(0, Math.floor(monthlyData.length / 6) - 1)}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={10}
                  tickFormatter={(value) => 
                    type === 'streams' 
                      ? value.toLocaleString() 
                      : formatCurrency(value)
                  }
                />
                <Tooltip 
                  formatter={(value: number) => [
                    type === 'streams' 
                      ? value.toLocaleString() 
                      : formatCurrency(value),
                    type === 'streams' ? 'Streams' : 'Revenue'
                  ]}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  contentStyle={{ 
                    fontSize: '12px', 
                    padding: '8px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={type === 'streams' ? 'streams' : 'revenue'}
                  stroke={type === 'streams' ? '#8b5cf6' : '#3b82f6'}
                  strokeWidth={2.5}
                  dot={{ fill: type === 'streams' ? '#8b5cf6' : '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: type === 'streams' ? '#8b5cf6' : '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500 mb-1">Total</div>
              <div className="font-semibold">
                {type === 'streams' 
                  ? monthlyData.reduce((sum, d) => sum + d.streams, 0).toLocaleString()
                  : formatCurrency(monthlyData.reduce((sum, d) => sum + d.revenue, 0))
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500 mb-1">Peak Month</div>
              <div className="font-semibold">
                {type === 'streams' 
                  ? monthlyData.reduce((max, d) => d.streams > max.streams ? d : max).period
                  : monthlyData.reduce((max, d) => d.revenue > max.revenue ? d : max).period
                }
              </div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="max-h-24 overflow-y-auto border rounded-lg bg-gray-50">
            <div className="p-2 space-y-1">
              {monthlyData.map((data, index) => (
                <div key={`${data.year}-${data.month}`} className="flex justify-between text-xs">
                  <span className="text-gray-600">{data.period}</span>
                  <span className="font-medium">
                    {type === 'streams' 
                      ? data.streams.toLocaleString() 
                      : formatCurrency(data.revenue)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-8">No data available</div>
      )}
    </div>
  );
}

export default function AlbumFinancialPage() {
  const params = useParams();
  const upc = params.upc as string;
  const { getToken } = useAuth();
  
  const currentDate = new Date();
  const dateRange = {
    start: new CalendarDate(2023, 1, 1),
    end: new CalendarDate(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
  };

  // Fetch album financial data
  const { data: albumData, isLoading, error } = useQuery<AlbumFinancialResponse>({
    queryKey: ["album-financials", upc, dateRange],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      return fetchAlbumFinancialData({
        token: token!,
        upc,
        startYear: dateRange.start?.year,
        startMonth: dateRange.start?.month,
        endYear: dateRange.end?.year,
        endMonth: dateRange.end?.month,
      });
    },
    enabled: !!upc,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardBody className="text-center">
            <div className="text-lg mb-2">⚠️</div>
            <p className="text-danger">Error loading album financial data</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Album Financial Dashboard</h1>
        <p className="text-default-600">
          UPC: {upc} {albumData?.album_name && `• ${albumData.album_name}`}
        </p>
      </div>


      {/* Financial Charts */}
      {albumData && albumData.monthly_data && albumData.monthly_data.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <div>
                <h3 className="text-lg font-bold">Monthly Performance</h3>
                <p className="text-sm text-default-600">
                  Stream counts and revenue trends over time
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                {albumData.monthly_data.length} months
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Streams Chart */}
              <div>
                <h4 className="text-md font-semibold mb-4 text-purple-700">Monthly Streams</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={albumData.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period"
                        stroke="#666"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={11}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip 
                        labelStyle={{ color: '#333' }}
                        formatter={(value: number) => [
                          value.toLocaleString(),
                          'Total Streams'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_streams"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        name="Monthly Streams"
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Streaming Revenue Chart */}
              <div>
                <h4 className="text-md font-semibold mb-4 text-blue-700">Streaming Revenue</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={albumData.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period"
                        stroke="#666"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={11}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        labelStyle={{ color: '#333' }}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          'Streaming Revenue'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="streaming_revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Streaming Revenue"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Performers - Compact Tables */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 Regions */}
              {albumData.top_regions && albumData.top_regions.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3 text-gray-700">Top 10 Regions</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Region</th>
                          <th className="text-right p-2 font-medium text-gray-600">Streams</th>
                          <th className="text-right p-2 font-medium text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {albumData.top_regions.slice(0, 10).map((region, index) => (
                          <tr key={region.region} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-gray-700">{region.region}</td>
                            <td className="p-2 text-right text-gray-600">
                              <Popover placement="top" showArrow>
                                <PopoverTrigger>
                                  <span className="cursor-help hover:text-purple-600 transition-colors">
                                    {region.total_streams?.toLocaleString() || '0'}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <MonthlyDataTooltip 
                                    monthlyData={region.monthly_data} 
                                    type="streams" 
                                  />
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="p-2 text-right text-gray-600">
                              <Popover placement="top" showArrow>
                                <PopoverTrigger>
                                  <span className="cursor-help hover:text-blue-600 transition-colors">
                                    {formatCurrency(region.total_revenue || 0)}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <MonthlyDataTooltip 
                                    monthlyData={region.monthly_data} 
                                    type="revenue" 
                                  />
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top 10 DSPs */}
              {albumData.top_dsps && albumData.top_dsps.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3 text-gray-700">Top 10 DSPs</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Platform</th>
                          <th className="text-right p-2 font-medium text-gray-600">Streams</th>
                          <th className="text-right p-2 font-medium text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {albumData.top_dsps.slice(0, 10).map((dsp, index) => (
                          <tr key={dsp.dsp} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-gray-700">{dsp.dsp}</td>
                            <td className="p-2 text-right text-gray-600">
                              <Popover placement="top" showArrow>
                                <PopoverTrigger>
                                  <span className="cursor-help hover:text-purple-600 transition-colors">
                                    {dsp.total_streams?.toLocaleString() || '0'}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <MonthlyDataTooltip 
                                    monthlyData={dsp.monthly_data} 
                                    type="streams" 
                                  />
                                </PopoverContent>
                              </Popover>
                            </td>
                            <td className="p-2 text-right text-gray-600">
                              <Popover placement="top" showArrow>
                                <PopoverTrigger>
                                  <span className="cursor-help hover:text-blue-600 transition-colors">
                                    {formatCurrency(dsp.total_revenue || 0)}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <MonthlyDataTooltip 
                                    monthlyData={dsp.monthly_data} 
                                    type="revenue" 
                                  />
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardBody className="text-center py-12">
            <div className="text-lg mb-2">📊</div>
            <p className="text-default-500">
              No financial data available for this album in the selected date range.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Summary Cards */}
      {albumData && albumData.monthly_data && albumData.monthly_data.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Financial Summary</h3>
          </CardHeader>
          <CardBody>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-red-600 text-sm font-medium mb-1">Total Spending</div>
                <div className="text-red-700 text-xl font-bold">
                  {formatCurrency(albumData.summary.total_spending)}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-1">Total Advances</div>
                <div className="text-blue-700 text-xl font-bold">
                  {formatCurrency(albumData.summary.total_advances)}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-orange-600 text-sm font-medium mb-1">Marketing & Ads</div>
                <div className="text-orange-700 text-xl font-bold">
                  {formatCurrency(albumData.summary.marketing_ads_spending)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-1">Other Spending</div>
                <div className="text-purple-700 text-xl font-bold">
                  {formatCurrency(albumData.summary.other_spending)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-green-600 text-sm font-medium mb-1">Streaming Revenue</div>
                <div className="text-green-700 text-xl font-bold">
                  {formatCurrency(albumData.summary.total_streaming_revenue)}
                </div>
              </div>
            </div>

            {/* Net Result */}
            <div className="mt-4">
              {(() => {
                const netAmount = albumData.summary.total_advances + albumData.summary.total_streaming_revenue - albumData.summary.total_spending;
                const isProfit = netAmount >= 0;
                return (
                  <div className={`rounded-lg p-4 border-2 ${
                    isProfit 
                      ? 'bg-green-50 border-green-300 text-green-800' 
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">
                        Net Result (Advances + Streaming - Spending)
                      </div>
                      <div className="text-3xl font-bold">
                        {formatCurrency(netAmount)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Histogram Charts */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Spending Breakdown Chart */}
              {albumData.summary.monthly_spending_breakdown.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Monthly Spending Breakdown</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={albumData.summary.monthly_spending_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="period"
                          stroke="#666"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis 
                          stroke="#666"
                          fontSize={11}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          labelStyle={{ color: '#333' }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === 'marketing_ads_spending' ? 'Marketing & Ads' : 'Other Spending'
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="marketing_ads_spending"
                          stackId="spending"
                          fill="#fb923c"
                          name="Marketing & Ads"
                        />
                        <Bar
                          dataKey="other_spending"
                          stackId="spending"
                          fill="#a855f7"
                          name="Other Spending"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Monthly Advances Chart */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Advances Timing</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={albumData.summary.monthly_advances}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period"
                        stroke="#666"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={11}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        labelStyle={{ color: '#333' }}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          'Advance Amount'
                        ]}
                        contentStyle={{ backgroundColor: '#fff' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="advances_amount"
                        fill="#3b82f6"
                        name="Advance Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Empty state for spending breakdown when no data */}
              {albumData.summary.monthly_spending_breakdown.length === 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Monthly Spending Breakdown</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No spending data available for the selected period</p>
                  </div>
                </div>
              )}
            </div>

          </CardBody>
        </Card>
      )}
    </div>
  );
}