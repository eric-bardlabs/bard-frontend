import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Progress,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export type SplitDisplayRow = {
  id: string;
  collaboratorName?: string;
  collaboratorEmail?: string;
  songwriting: string | number;
  publishing: string | number;
  master: string | number;
};

type SplitsDisplayProps = {
  splitRows: SplitDisplayRow[];
  totals: {
    songwriting: number;
    publishing: number;
    master: number;
  };
};

export const SplitsDisplay: React.FC<SplitsDisplayProps> = ({
  splitRows,
  totals,
}) => {
  const getTotalColor = (total: number) => {
    if (total === 100) return "success";
    if (total > 100) return "danger";
    return "warning";
  };

  return (
    <div className="flex flex-col w-full">
      <div className="border border-divider rounded-medium overflow-hidden">
        <Table removeWrapper aria-label="Collaborator splits display table">
          <TableHeader>
            <TableColumn className="w-1/4">COLLABORATOR</TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>SONGWRITING</span>
                <Tooltip content="Rights for composing the song">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>PUBLISHING</span>
                <Tooltip content="Rights for distributing the composition">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>MASTER</span>
                <Tooltip content="Rights for the sound recording">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
          </TableHeader>
          <TableBody>
            <>
              {splitRows.filter(row => row.id && row.collaboratorName).map((split, index) => (
                <TableRow key={`${split.id}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                        {split.collaboratorName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {split.collaboratorName || "Unknown"}
                        </p>
                        <p className="text-tiny text-default-500">
                          {split.collaboratorEmail || ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-3 rounded-full bg-default-100 overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, parseFloat(split.songwriting?.toString() || "0")))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {parseFloat(split.songwriting?.toString() || "0")}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-3 rounded-full bg-default-100 overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, parseFloat(split.publishing?.toString() || "0")))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {parseFloat(split.publishing?.toString() || "0")}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-3 rounded-full bg-default-100 overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, parseFloat(split.master?.toString() || "0")))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {parseFloat(split.master?.toString() || "0")}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-default-50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Songwriting total"
                      value={totals.songwriting}
                      maxValue={100}
                      color={getTotalColor(totals.songwriting)}
                      size="sm"
                      className="max-w-[80px]"
                    />
                    <Chip
                      size="sm"
                      color={getTotalColor(totals.songwriting)}
                      variant="flat"
                    >
                      {totals.songwriting}%
                    </Chip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Publishing total"
                      value={totals.publishing}
                      maxValue={100}
                      color={getTotalColor(totals.publishing)}
                      size="sm"
                      className="max-w-[80px]"
                    />
                    <Chip
                      size="sm"
                      color={getTotalColor(totals.publishing)}
                      variant="flat"
                    >
                      {totals.publishing}%
                    </Chip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Master total"
                      value={totals.master}
                      maxValue={100}
                      color={getTotalColor(totals.master)}
                      size="sm"
                      className="max-w-[80px]"
                    />
                    <Chip
                      size="sm"
                      color={getTotalColor(totals.master)}
                      variant="flat"
                    >
                      {totals.master}%
                    </Chip>
                  </div>
                </TableCell>
              </TableRow>
            </>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};