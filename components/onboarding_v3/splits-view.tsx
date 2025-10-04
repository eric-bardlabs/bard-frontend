import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface SplitsViewProps {
  splits: {
    id: string;
    name: string;
    songwriting: number;
    publishing: number;
    master: number;
  }[];
  totals: {
    songwriting: number;
    publishing: number;
    master: number;
  };
  onEditClick: () => void;
}

export const SplitsView: React.FC<SplitsViewProps> = ({
  splits,
  totals,
  onEditClick,
}) => {
  const getTotalColor = (total: number) => {
    if (total === 100) return "success";
    if (total > 100) return "danger";
    return "warning";
  };

  return (
    <div className="border border-divider rounded-medium overflow-hidden">
      <Table removeWrapper aria-label="Collaborator splits table">
        <TableHeader>
          <TableColumn className="w-1/4">COLLABORATOR</TableColumn>
          <TableColumn className="w-1/4">
            <div className="flex items-center gap-1">
              <span>SONGWRITING</span>
              <Tooltip content="Rights for composing the song">
                <Icon icon="lucide:info" className="text-default-400 text-sm" />
              </Tooltip>
            </div>
          </TableColumn>
          <TableColumn className="w-1/4">
            <div className="flex items-center gap-1">
              <span>PUBLISHING</span>
              <Tooltip content="Rights for distributing the composition">
                <Icon icon="lucide:info" className="text-default-400 text-sm" />
              </Tooltip>
            </div>
          </TableColumn>
          <TableColumn className="w-1/4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>MASTER</span>
                <Tooltip content="Rights for the sound recording">
                  <Icon icon="lucide:info" className="text-default-400 text-sm" />
                </Tooltip>
              </div>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:edit-3" />}
                onPress={onEditClick}
              >
                Edit Splits
              </Button>
            </div>
          </TableColumn>
        </TableHeader>
        <TableBody>
          {[
            ...splits.map((split) => (
              <TableRow key={split.id}>
                <TableCell>
                  <p className="font-medium">{split.name}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label={`${split.name} songwriting split`}
                      value={split.songwriting}
                      maxValue={100}
                      color="primary"
                      size="sm"
                      className="max-w-24"
                    />
                    <span className="text-sm min-w-[3rem]">{split.songwriting}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label={`${split.name} publishing split`}
                      value={split.publishing}
                      maxValue={100}
                      color="primary"
                      size="sm"
                      className="max-w-24"
                    />
                    <span className="text-sm min-w-[3rem]">{split.publishing}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label={`${split.name} master split`}
                      value={split.master}
                      maxValue={100}
                      color="primary"
                      size="sm"
                      className="max-w-24"
                    />
                    <span className="text-sm min-w-[3rem]">{split.master}%</span>
                  </div>
                </TableCell>
              </TableRow>
            )),
            <TableRow className="bg-default-50 font-medium" key="totals">
              <TableCell>TOTAL</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    aria-label="Songwriting total"
                    value={totals.songwriting}
                    maxValue={100}
                    color={getTotalColor(totals.songwriting)}
                    size="sm"
                    className="max-w-24"
                  />
                  <span className={`text-${getTotalColor(totals.songwriting)} text-sm min-w-[3rem]`}>
                    {totals.songwriting}%
                  </span>
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
                    className="max-w-24"
                  />
                  <span className={`text-${getTotalColor(totals.publishing)} text-sm min-w-[3rem]`}>
                    {totals.publishing}%
                  </span>
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
                    className="max-w-24"
                  />
                  <span className={`text-${getTotalColor(totals.master)} text-sm min-w-[3rem]`}>
                    {totals.master}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ]}
        </TableBody>
      </Table>
    </div>
  );
};