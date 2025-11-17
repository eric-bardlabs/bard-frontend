"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  DateRangePicker,
  Spinner,
} from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { RangeValue } from "@react-types/shared";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Track } from "@/lib/api/tracks";
import { fetchTrackFinancialData, FinancialDataResponse } from "@/lib/api/financials";

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

const sourceOptions = [
  { key: "", label: "All Sources" },
  { key: "distrokid", label: "DistroKid" },
  { key: "tunecore", label: "TuneCore" },
  { key: "cdbaby", label: "CD Baby" },
  { key: "amuse", label: "Amuse" },
  { key: "ditto", label: "Ditto Music" },
];

interface FinancialProps {
  song: Track;
}

export const Financial = ({ song }: FinancialProps) => {
  const { getToken } = useAuth();
  const [selectedDsp, setSelectedDsp] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new CalendarDate(2025, 1, 1),
    end: new CalendarDate(2025, 12, 31),
  });

  // Fetch financial data
  const { data: financialData, isLoading, refetch } = useQuery<FinancialDataResponse>({
    queryKey: ["financial-data", song.id, selectedDsp, selectedType, selectedSource, dateRange],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      return fetchTrackFinancialData({
        token: token!,
        trackId: song.id,
        startYear: dateRange.start?.year,
        startMonth: dateRange.start?.month,
        endYear: dateRange.end?.year,
        endMonth: dateRange.end?.month,
        dsp: selectedDsp || undefined,
        type: selectedType || undefined,
        source: selectedSource || undefined,
      });
    },
    enabled: !!song.id,
  });

  const handleDateRangeChange = (value: RangeValue<CalendarDate> | null) => {
    if (value?.start && value?.end) {
      setDateRange({ start: value.start, end: value.end });
    }
  };

  const handleSearch = () => {
    refetch();
  };

  const formatPeriod = (year: number, month: number) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  const totalAmount = financialData?.total_amount || 0;
  const totalCount = financialData?.total_count || 0;
  const data = financialData?.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Financial Information Search</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
              selectedKeys={[selectedDsp]}
              onSelectionChange={(keys) => setSelectedDsp(Array.from(keys)[0] as string)}
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
              selectedKeys={[selectedType]}
              onSelectionChange={(keys) => setSelectedType(Array.from(keys)[0] as string)}
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
              selectedKeys={[selectedSource]}
              onSelectionChange={(keys) => setSelectedSource(Array.from(keys)[0] as string)}
              variant="bordered"
            >
              {sourceOptions.map((option) => (
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
                <TableColumn>PERIOD</TableColumn>
                <TableColumn>SOURCE</TableColumn>
                <TableColumn>DSP</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No financial data found">
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{formatPeriod(item.year, item.month)}</div>
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
                      <span className="font-semibold text-success">
                        {item.amount ? formatCurrency(item.amount) : "N/A"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};